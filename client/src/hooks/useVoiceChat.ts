import type { Room } from "@chaos-club/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

const peerConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useVoiceChat(room: Room) {
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const audioRef = useRef(new Map<string, HTMLAudioElement>());
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const speakingCleanupRef = useRef<(() => void) | null>(null);

  const attachRemoteStream = useCallback((socketId: string, stream: MediaStream) => {
    let audio = audioRef.current.get(socketId);
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      audioRef.current.set(socketId, audio);
    }
    audio.srcObject = stream;
    void audio.play().catch(() => {
      setError("Remote audio is ready. Interact with the page if your browser blocks autoplay.");
    });
  }, []);

  const createPeer = useCallback((remoteSocketId: string) => {
    const existing = peersRef.current.get(remoteSocketId);
    if (existing) return existing;

    const peer = new RTCPeerConnection(peerConfig);
    peersRef.current.set(remoteSocketId, peer);

    const tracks = streamRef.current?.getAudioTracks() ?? [];
    if (tracks.length > 0 && streamRef.current) {
      tracks.forEach((track) => peer.addTrack(track, streamRef.current!));
    } else {
      peer.addTransceiver("audio", { direction: "recvonly" });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("voice:ice-candidate", {
          targetSocketId: remoteSocketId,
          candidate: event.candidate.toJSON(),
        });
      }
    };
    peer.ontrack = (event) => attachRemoteStream(remoteSocketId, event.streams[0] ?? new MediaStream([event.track]));
    peer.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(peer.connectionState)) {
        peer.close();
        peersRef.current.delete(remoteSocketId);
      }
    };
    return peer;
  }, [attachRemoteStream]);

  const sendOffer = useCallback(async (remoteSocketId: string) => {
    const peer = createPeer(remoteSocketId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("voice:offer", { targetSocketId: remoteSocketId, description: offer });
  }, [createPeer]);

  useEffect(() => {
    const activeRemoteIds = new Set(room.players.filter((player) => player.socketId !== socket.id).map((player) => player.socketId));

    for (const remoteId of activeRemoteIds) {
      if (!peersRef.current.has(remoteId) && socket.id && socket.id.localeCompare(remoteId) < 0) {
        void sendOffer(remoteId).catch(() => setError("Could not establish a voice connection."));
      }
    }

    for (const [remoteId, peer] of peersRef.current) {
      if (!activeRemoteIds.has(remoteId)) {
        peer.close();
        peersRef.current.delete(remoteId);
        audioRef.current.get(remoteId)?.remove();
        audioRef.current.delete(remoteId);
      }
    }
  }, [room.players, sendOffer]);

  useEffect(() => {
    const onOffer = async ({ fromSocketId, description }: { fromSocketId: string; description: RTCSessionDescriptionInit }) => {
      try {
        const peer = createPeer(fromSocketId);
        await peer.setRemoteDescription(description);
        for (const candidate of pendingCandidatesRef.current.get(fromSocketId) ?? []) await peer.addIceCandidate(candidate);
        pendingCandidatesRef.current.delete(fromSocketId);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("voice:answer", { targetSocketId: fromSocketId, description: answer });
      } catch {
        setError("Voice offer negotiation failed.");
      }
    };

    const onAnswer = async ({ fromSocketId, description }: { fromSocketId: string; description: RTCSessionDescriptionInit }) => {
      try {
        const peer = peersRef.current.get(fromSocketId);
        if (!peer) return;
        await peer.setRemoteDescription(description);
        for (const candidate of pendingCandidatesRef.current.get(fromSocketId) ?? []) await peer.addIceCandidate(candidate);
        pendingCandidatesRef.current.delete(fromSocketId);
      } catch {
        setError("Voice answer negotiation failed.");
      }
    };

    const onCandidate = async ({ fromSocketId, candidate }: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(fromSocketId);
      if (!peer?.remoteDescription) {
        const queued = pendingCandidatesRef.current.get(fromSocketId) ?? [];
        queued.push(candidate);
        pendingCandidatesRef.current.set(fromSocketId, queued);
        return;
      }
      await peer.addIceCandidate(candidate).catch(() => setError("An ICE candidate could not be added."));
    };

    socket.on("voice:offer", onOffer);
    socket.on("voice:answer", onAnswer);
    socket.on("voice:ice-candidate", onCandidate);
    return () => {
      socket.off("voice:offer", onOffer);
      socket.off("voice:answer", onAnswer);
      socket.off("voice:ice-candidate", onCandidate);
    };
  }, [createPeer]);

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
      for (const peer of peersRef.current.values()) {
        for (const sender of peer.getSenders()) if (sender.track?.kind === "audio") await sender.replaceTrack(null);
      }
      socket.emit("player:mic", false);
      setMicEnabled(false);
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      streamRef.current = stream;
      const track = stream.getAudioTracks()[0];

      for (const [remoteId, peer] of peersRef.current) {
        const audioTransceiver = peer.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "audio");
        if (audioTransceiver && track) {
          await audioTransceiver.sender.replaceTrack(track);
          audioTransceiver.direction = "sendrecv";
        } else if (track) {
          peer.addTrack(track, stream);
        }
        await sendOffer(remoteId);
      }

      beginSpeakingDetection(stream);
      socket.emit("player:mic", true);
      setMicEnabled(true);
    } catch {
      setError("Microphone access was denied or no input device is available.");
    }
  }, [beginSpeakingDetection, micEnabled, sendOffer]);

  useEffect(() => () => {
    speakingCleanupRef.current?.();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    audioRef.current.forEach((audio) => audio.remove());
    audioRef.current.clear();
    socket.emit("player:mic", false);
  }, []);

  return { micEnabled, toggleMic, error };
}
