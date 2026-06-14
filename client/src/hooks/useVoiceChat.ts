import type { Room } from "@chaos-club/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../services/socket";

interface PeerNegotiationState {
  peer: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  settingRemoteAnswer: boolean;
}

function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];
  const turnUrl = import.meta.env.VITE_TURN_URL?.trim();
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME?.trim(),
      credential: import.meta.env.VITE_TURN_CREDENTIAL?.trim(),
    });
  }
  return servers;
}

const peerConfig: RTCConfiguration = { iceServers: getIceServers() };

export function useVoiceChat(room: Room, voiceGroupPlayerIds?: string[]) {
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerVolumes, setPlayerVolumes] = useState<Record<string, number>>({});
  const playerVolumesRef = useRef<Record<string, number>>({});
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, PeerNegotiationState>());
  const audioRef = useRef(new Map<string, HTMLAudioElement>());
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const speakingCleanupRef = useRef<(() => void) | null>(null);
  const allowedSocketIds = useMemo(() => {
    const allowedPlayerIds = new Set(voiceGroupPlayerIds ?? room.players.map((player) => player.id));
    return new Set(room.players.filter((player) => allowedPlayerIds.has(player.id)).map((player) => player.socketId));
  }, [room.players, voiceGroupPlayerIds]);
  const allowedSocketIdsRef = useRef(allowedSocketIds);
  allowedSocketIdsRef.current = allowedSocketIds;

  const attachRemoteStream = useCallback((socketId: string, stream: MediaStream) => {
    let audio = audioRef.current.get(socketId);
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      audio.volume = playerVolumesRef.current[socketId] ?? 1;
      audioRef.current.set(socketId, audio);
    }
    audio.srcObject = stream;
    audio.muted = !allowedSocketIdsRef.current.has(socketId);
    void audio.play().catch(() => {
      setError("Remote audio is ready. Click anywhere on the page, then toggle your microphone once.");
    });
  }, []);

  const setPlayerVolume = useCallback((socketId: string, volume: number) => {
    const normalizedVolume = Math.min(1, Math.max(0, volume));
    playerVolumesRef.current[socketId] = normalizedVolume;
    setPlayerVolumes((current) => ({ ...current, [socketId]: normalizedVolume }));
    const audio = audioRef.current.get(socketId);
    if (audio) audio.volume = normalizedVolume;
  }, []);

  const createPeer = useCallback((remoteSocketId: string) => {
    const existing = peersRef.current.get(remoteSocketId);
    if (existing) return existing;

    const peer = new RTCPeerConnection(peerConfig);
    const state: PeerNegotiationState = {
      peer,
      polite: Boolean(socket.id && socket.id.localeCompare(remoteSocketId) > 0),
      makingOffer: false,
      ignoreOffer: false,
      settingRemoteAnswer: false,
    };
    peersRef.current.set(remoteSocketId, state);

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("voice:ice-candidate", {
          targetSocketId: remoteSocketId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    peer.ontrack = (event) => {
      attachRemoteStream(remoteSocketId, event.streams[0] ?? new MediaStream([event.track]));
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") setError(null);
      if (peer.connectionState === "failed") {
        setError("Direct voice connection failed. A TURN server may be required for this network.");
        peer.restartIce();
      }
      if (peer.connectionState === "closed") peersRef.current.delete(remoteSocketId);
    };

    peer.onnegotiationneeded = async () => {
      try {
        state.makingOffer = true;
        await peer.setLocalDescription();
        if (!peer.localDescription) return;
        const eventName = peer.localDescription.type === "offer" ? "voice:offer" : "voice:answer";
        socket.emit(eventName, { targetSocketId: remoteSocketId, description: peer.localDescription });
      } catch {
        setError("Could not negotiate the voice connection.");
      } finally {
        state.makingOffer = false;
      }
    };

    const stream = streamRef.current;
    const track = stream?.getAudioTracks()[0];
    if (stream && track) peer.addTrack(track, stream);
    else peer.addTransceiver("audio", { direction: "sendrecv" });

    return state;
  }, [attachRemoteStream]);

  const applyDescription = useCallback(async (
    remoteSocketId: string,
    description: RTCSessionDescriptionInit,
  ) => {
    const state = createPeer(remoteSocketId);
    const { peer } = state;
    if (description.type === "answer" && peer.signalingState !== "have-local-offer") return;
    const readyForOffer = !state.makingOffer && (peer.signalingState === "stable" || state.settingRemoteAnswer);
    const offerCollision = description.type === "offer" && !readyForOffer;
    state.ignoreOffer = !state.polite && offerCollision;
    if (state.ignoreOffer) return;

    state.settingRemoteAnswer = description.type === "answer";
    try {
      await peer.setRemoteDescription(description);
    } finally {
      state.settingRemoteAnswer = false;
    }

    for (const candidate of pendingCandidatesRef.current.get(remoteSocketId) ?? []) {
      await peer.addIceCandidate(candidate);
    }
    pendingCandidatesRef.current.delete(remoteSocketId);

    if (description.type === "offer") {
      await peer.setLocalDescription();
      if (peer.localDescription) {
        socket.emit("voice:answer", { targetSocketId: remoteSocketId, description: peer.localDescription });
      }
    }
  }, [createPeer]);

  useEffect(() => {
    const activeRemoteIds = new Set(
      room.players.filter((player) => player.socketId !== socket.id).map((player) => player.socketId),
    );

    for (const remoteId of activeRemoteIds) {
      if (!peersRef.current.has(remoteId) && socket.id && socket.id.localeCompare(remoteId) < 0) {
        createPeer(remoteId);
      }
    }

    for (const [remoteId, state] of peersRef.current) {
      if (!activeRemoteIds.has(remoteId)) {
        state.peer.close();
        peersRef.current.delete(remoteId);
        const audio = audioRef.current.get(remoteId);
        if (audio) audio.srcObject = null;
        audioRef.current.delete(remoteId);
        pendingCandidatesRef.current.delete(remoteId);
      }
    }
  }, [createPeer, room.players]);

  useEffect(() => {
    for (const [remoteSocketId, audio] of audioRef.current) {
      audio.muted = !allowedSocketIds.has(remoteSocketId);
    }
    const track = streamRef.current?.getAudioTracks()[0] ?? null;
    void Promise.all([...peersRef.current].map(async ([remoteSocketId, state]) => {
      const transceiver = state.peer.getTransceivers().find((item) => item.receiver.track.kind === "audio");
      if (transceiver) await transceiver.sender.replaceTrack(allowedSocketIds.has(remoteSocketId) ? track : null);
    }));
  }, [allowedSocketIds]);

  useEffect(() => {
    const onOffer = ({ fromSocketId, description }: { fromSocketId: string; description: RTCSessionDescriptionInit }) => {
      void applyDescription(fromSocketId, description).catch(() => setError("Voice offer negotiation failed."));
    };
    const onAnswer = ({ fromSocketId, description }: { fromSocketId: string; description: RTCSessionDescriptionInit }) => {
      void applyDescription(fromSocketId, description).catch(() => setError("Voice answer negotiation failed."));
    };
    const onCandidate = async ({ fromSocketId, candidate }: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
      const state = peersRef.current.get(fromSocketId);
      if (state?.ignoreOffer) return;
      if (!state?.peer.remoteDescription) {
        const queued = pendingCandidatesRef.current.get(fromSocketId) ?? [];
        queued.push(candidate);
        pendingCandidatesRef.current.set(fromSocketId, queued);
        return;
      }
      try {
        await state.peer.addIceCandidate(candidate);
      } catch {
        if (!state.ignoreOffer) setError("An ICE candidate could not be added.");
      }
    };

    socket.on("voice:offer", onOffer);
    socket.on("voice:answer", onAnswer);
    socket.on("voice:ice-candidate", onCandidate);
    return () => {
      socket.off("voice:offer", onOffer);
      socket.off("voice:answer", onAnswer);
      socket.off("voice:ice-candidate", onCandidate);
    };
  }, [applyDescription]);

  const beginSpeakingDetection = useCallback((stream: MediaStream) => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.frequencyBinCount);
    let previous = false;

    const timer = window.setInterval(() => {
      analyser.getByteFrequencyData(samples);
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const speaking = average > 18;
      if (speaking !== previous) {
        previous = speaking;
        socket.emit("player:speaking", speaking);
      }
    }, 180);

    speakingCleanupRef.current = () => {
      window.clearInterval(timer);
      socket.emit("player:speaking", false);
      void context.close();
    };
  }, []);

  const toggleMic = useCallback(async () => {
    if (micEnabled) {
      speakingCleanupRef.current?.();
      speakingCleanupRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      for (const state of peersRef.current.values()) {
        const transceiver = state.peer.getTransceivers().find((item) => item.receiver.track.kind === "audio");
        if (transceiver) {
          await transceiver.sender.replaceTrack(null);
        }
      }
      socket.emit("player:mic", false);
      setMicEnabled(false);
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;
      const track = stream.getAudioTracks()[0];

      for (const [remoteSocketId, state] of peersRef.current) {
        const transceiver = state.peer.getTransceivers().find((item) => item.receiver.track.kind === "audio");
        if (transceiver && track) {
          await transceiver.sender.replaceTrack(allowedSocketIdsRef.current.has(remoteSocketId) ? track : null);
        } else if (track && allowedSocketIdsRef.current.has(remoteSocketId)) {
          state.peer.addTrack(track, stream);
        }
      }

      beginSpeakingDetection(stream);
      socket.emit("player:mic", true);
      setMicEnabled(true);
    } catch {
      setError("Microphone access was denied or no input device is available.");
    }
  }, [beginSpeakingDetection, micEnabled]);

  useEffect(() => () => {
    speakingCleanupRef.current?.();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peersRef.current.forEach((state) => state.peer.close());
    peersRef.current.clear();
    audioRef.current.forEach((audio) => { audio.srcObject = null; });
    audioRef.current.clear();
    socket.emit("player:mic", false);
  }, []);

  return { micEnabled, toggleMic, error, playerVolumes, setPlayerVolume };
}
