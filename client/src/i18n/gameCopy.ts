import type { GameChoice, PublicTask, RoundResult } from "@chaos-club/shared";
import type { Language } from "./LanguageContext";

interface TaskCopy {
  name: string;
  description: string;
  objective: string;
  rules: string[];
  negotiationTip: string;
}

const taskCopies: Record<Language, Record<string, TaskCopy>> = {
  tr: {
    "fake-contract": {
      name: "Sahte Sözleşme",
      description: "İki taraf aynı sözleşmenin başında. Gerçek güven iyi kazandırır, fakat başarılı bir ihanet daha değerlidir.",
      objective: "Karşındaki oyuncuyu gerçek imza atacağına ikna et veya onun güvenini kullanarak sahte imza at.",
      rules: ["İkiniz de Gerçek İmza seçerseniz kişi başı +5.", "Yalnızca biri Sahte İmza seçerse hain +8, diğeri 0.", "İkiniz de Sahte İmza seçerseniz kişi başı -2."],
      negotiationTip: "Sözlerine, önceki turlardaki davranışlarına ve mevcut puan durumuna dikkat et.",
    },
    "shared-vault": {
      name: "Ortak Kasa",
      description: "Önünüzde ortak bir kasa var. Birlikte açabilir veya daha büyük pay umuduyla kaçabilirsiniz.",
      objective: "Güvenli ortak kazanç ile riskli kişisel kazanç arasında karar ver.",
      rules: ["İkiniz de Kasayı Aç seçerseniz kişi başı +4.", "Biri Kaç seçerse kaçan +7, kasayı açan 0.", "İkiniz de Kaç seçerseniz kişi başı +1."],
      negotiationTip: "Kaçmak cazip görünür; fakat rakibin de aynı şeyi düşünmesi toplam kazancı düşürür.",
    },
    guarantor: {
      name: "Kefil",
      description: "İki oyuncu söz verir. Üçüncü oyuncu, hangisinin güvenilmeyi hak ettiğine karar verir.",
      objective: "Anlaşma oyuncuları sözünü tutabilir veya bozabilir. Kefil dürüst kalacak tarafı tahmin eder.",
      rules: ["İki söz de tutulursa anlaşma oyuncuları +4.", "Tek kişi sözünü bozarsa bozan +7, dürüst oyuncu 0.", "İkisi de bozarsa kişi başı -1.", "Kefil doğru dürüst tarafı seçerse +3, yanlışsa -2; davranışlar aynıysa 0."],
      negotiationTip: "Kefil yalnızca söylenenleri değil, oyuncuların birbirine verdiği tepkileri de okumalıdır.",
    },
    "hostage-points": {
      name: "Rehin Puan",
      description: "Bir oyuncu puanlarını rehin bırakır. Diğer oyuncu rehini iade etmek veya çalmak arasında karar verir.",
      objective: "Rehini tutan oyuncu tek kararı verir; diğer oyuncu konuşarak onu ikna etmeye çalışır.",
      rules: ["Rehin iade edilirse iki oyuncu da +3.", "Rehin çalınırsa tutan +6, bırakan -2."],
      negotiationTip: "Gelecek turlarda karşılık verme veya ittifak teklifleri bu görevde güçlü olabilir.",
    },
    "secret-partners": {
      name: "Gizli Ortaklık",
      description: "İki gizli ortak, kimliklerini açığa çıkarmadan aynı sinyali seçmeye çalışır.",
      objective: "Ortaklar konuşma içinde gizli bir koordinasyon kurar; diğer oyuncular ortakların kim olduğunu tahmin eder.",
      rules: ["Ortaklar aynı sinyali seçerse ikisi de +5.", "Sinyaller farklıysa ortaklar 0 alır.", "Ortakları doğru tahmin eden +4, yanlış tahmin eden -1 alır."],
      negotiationTip: "Çok açık koordinasyon ortakları ele verir; çok gizli koordinasyon ise sinyallerin ayrışmasına yol açabilir.",
    },
  },
  en: {
    "fake-contract": { name: "Fake Contract", description: "Two sides face the same contract. Real trust pays well, but successful betrayal pays more.", objective: "Convince the other player you will sign for real, or exploit their trust with a fake signature.", rules: ["Both Real Sign: +5 each.", "One Fake Sign: betrayer +8, other player 0.", "Both Fake Sign: -2 each."], negotiationTip: "Watch promises, previous behavior and the current score." },
    "shared-vault": { name: "Shared Vault", description: "A shared vault stands before you. Open it together or run for a larger personal payout.", objective: "Choose between reliable cooperation and risky personal gain.", rules: ["Both Open Vault: +4 each.", "One Runs Away: runner +7, opener 0.", "Both Run Away: +1 each."], negotiationTip: "Running is tempting, but matching greed reduces the total reward." },
    guarantor: { name: "The Guarantor", description: "Two players make a promise. A third decides who deserves trust.", objective: "Deal players keep or break their promise. The guarantor predicts the honest side.", rules: ["Both keep: deal players +4.", "One breaks: betrayer +7, honest player 0.", "Both break: -1 each.", "Correct guarantor guess +3, wrong guess -2, equal behavior 0."], negotiationTip: "The guarantor should read reactions as well as spoken promises." },
    "hostage-points": { name: "Hostage Points", description: "One player leaves points as hostage. The other decides whether to return or steal them.", objective: "The holder makes the only decision while the depositor negotiates for their points.", rules: ["Return: both players +3.", "Steal: holder +6, depositor -2."], negotiationTip: "Future favors and alliance offers can be powerful here." },
    "secret-partners": { name: "Secret Partnership", description: "Two secret partners try to choose the same signal without revealing themselves.", objective: "Partners coordinate inside the conversation while everyone else guesses their identities.", rules: ["Matching signals: partners +5 each.", "Different signals: partners receive 0.", "Correct partner guess +4, wrong guess -1."], negotiationTip: "Obvious coordination exposes you; subtle coordination risks a mismatch." },
  },
};

const choiceCopies: Record<Language, Record<string, string>> = {
  tr: { real: "Gerçek İmza", fake: "Sahte İmza", open: "Kasayı Aç", run: "Kaç", keep: "Sözünü Tut", break: "Sözünü Boz", return: "Rehini İade Et", steal: "Rehini Çal", "signal:a": "Sinyal A", "signal:b": "Sinyal B", "signal:c": "Sinyal C" },
  en: { real: "Real Sign", fake: "Fake Sign", open: "Open Vault", run: "Run Away", keep: "Keep Promise", break: "Break Promise", return: "Return Hostage", steal: "Steal Hostage", "signal:a": "Signal A", "signal:b": "Signal B", "signal:c": "Signal C" },
};

const choiceDescriptions: Record<Language, Record<string, string>> = {
  tr: { real: "Sözleşmeye sadık kal.", fake: "Diğer imza sahibine ihanet et.", open: "İş birliği yap ve kasayı paylaş.", run: "Daha büyük pay için kaç.", keep: "Verdiğin sözü yerine getir.", break: "Sözünü boz ve avantajı al.", return: "Rehini iade edip ortak kazan.", steal: "Rehin puanları kendine al." },
  en: { real: "Honor the contract.", fake: "Betray the other signer.", open: "Cooperate and share the vault.", run: "Run for the larger payout.", keep: "Honor your promise.", break: "Break your promise for the advantage.", return: "Return the hostage and share the gain.", steal: "Keep the hostage points." },
};

const outcomeCopies: Record<Language, Record<string, string>> = {
  tr: {
    "mutual-trust": "İki taraf da güveni seçti ve sözleşme kazandırdı.", "mutual-betrayal": "İki taraf da ihanet etti ve ikisi de kaybetti.", betrayal: "Sözleşme tek taraflı ihanetle sonuçlandı.",
    "mutual-open": "İki oyuncu kasayı birlikte açtı.", "mutual-run": "İki oyuncu da kaçtı ve düşük kazançla yetindi.", "one-ran": "Bir oyuncu kasadan kaçıp avantajı aldı.",
    "both-kept": "İki oyuncu da sözünü tuttu.", "both-broke": "İki oyuncu da sözünü bozdu.", "mixed-promise": "Bir söz tutuldu, diğeri bozuldu.",
    returned: "Rehin puanlar sahibine geri verildi.", stolen: "Rehin puanlar çalındı.",
    "signals-matched": "Gizli ortaklar aynı sinyali buldu.", "signals-missed": "Gizli ortakların sinyalleri eşleşmedi.",
  },
  en: {
    "mutual-trust": "Both sides chose trust and the contract paid out.", "mutual-betrayal": "Both sides betrayed and both lost.", betrayal: "The contract ended in one-sided betrayal.",
    "mutual-open": "Both players opened the vault together.", "mutual-run": "Both players ran and settled for a small reward.", "one-ran": "One player escaped with the advantage.",
    "both-kept": "Both players kept their promise.", "both-broke": "Both players broke their promise.", "mixed-promise": "One promise held while the other broke.",
    returned: "The hostage points were returned.", stolen: "The hostage points were stolen.",
    "signals-matched": "The secret partners matched their signal.", "signals-missed": "The secret partners failed to match signals.",
  },
};

export function getTaskCopy(task: PublicTask, language: Language): TaskCopy {
  return taskCopies[language][task.id] ?? { name: task.name, description: task.description, objective: task.description, rules: [], negotiationTip: "" };
}

export function getChoiceLabel(choice: GameChoice | { id: string; label: string }, language: Language): string {
  if (choice.id.startsWith("trust:")) return `${language === "tr" ? "Güven" : "Trust"}: ${choice.label.replace(/^Trust /, "")}`;
  if (choice.id.startsWith("guess:")) return `${language === "tr" ? "Tahmin" : "Guess"}: ${choice.label}`;
  return choiceCopies[language][choice.id] ?? choice.label;
}

export function getChoiceDescription(choice: GameChoice, language: Language): string {
  return choiceDescriptions[language][choice.id] ?? choice.description ?? "";
}

export function getPrivateHint(task: PublicTask, language: Language): string | undefined {
  if (!task.privateHint) return undefined;
  if (language === "en") return task.privateHint;
  if (task.id === "guarantor") return "Anlaşmayı izle ve hangi oyuncunun daha dürüst davranacağını tahmin et.";
  if (task.id === "hostage-points") return "Rehin senin kontrolünde. Son karar yalnızca sana ait.";
  if (task.id === "secret-partners") {
    const match = task.privateHint.match(/Your secret partner is (.+)\. Match/);
    return match ? `Gizli ortağın ${match[1]}. Onunla aynı sinyali seç.` : "Gizli ortağınla aynı sinyali seç.";
  }
  return task.privateHint;
}

export function getRoleLabel(role: string | undefined, isBot: boolean, language: Language): string {
  if (!role) return isBot ? (language === "tr" ? "Kasa Botu" : "House Bot") : (language === "tr" ? "Oyuncu" : "Player");
  if (language === "en") return role;
  const roles: Record<string, string> = { "Player A": "Oyuncu A", "Player B": "Oyuncu B", Guarantor: "Kefil", Depositor: "Rehini Bırakan", Holder: "Rehini Tutan", "The House": "Kasa" };
  return roles[role] ?? role;
}

export function getOutcomeText(result: RoundResult, language: Language): string {
  return outcomeCopies[language][result.outcomeId] ?? result.summary;
}
