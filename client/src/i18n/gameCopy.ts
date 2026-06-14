import type { AbilityId, GameChoice, PublicTask, RoundResult } from "@chaos-club/shared";
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
    "single-veto": {
      name: "Tek Veto",
      description: "Ortada ortak bir Nüfuz havuzu var. Herkes gizlice EVET veya HAYIR diyecek.",
      objective: "Herkesi EVET'e ikna et veya tek HAYIR oyu olarak gizli ödülü almaya çalış.",
      rules: ["Hiç HAYIR yoksa havuz eşit bölünür.", "Tek HAYIR varsa yalnız veto sahibi +2 Nüfuz alır.", "İki veya daha fazla HAYIR varsa havuz yanar; HAYIR verenler 1 Güven kaybeder."],
      negotiationTip: "HAYIR demek ancak bunu yapan tek kişiysen değerlidir. Verilen sözlerin ne kadar güvenilir olduğunu tart.",
    },
    "paired-confrontation": {
      name: "Çiftli Yüzleşme",
      description: "Seçilen iki oyuncu Sadakat veya İhanet arasında gizli karar verir.",
      objective: "Kısa vadeli Nüfuz ile uzun vadeli Güven ve Koz dengesi arasında seçim yap.",
      rules: ["İki Sadakat: iki taraf da +3 Nüfuz.", "Tek İhanet: ihanet eden +6, sadık kalan -1 ve hedefe karşı Koz kazanır.", "İki İhanet: iki taraf da -1 Nüfuz ve -1 Güven."],
      negotiationTip: "İhanet daha çok kazandırır fakat hedefin eline finalde kullanılabilecek bir Koz bırakır.",
    },
    "coalition-negotiation": {
      name: "Koalisyon Müzakeresi",
      description: "Koalisyon aynı bölüşüm planında birleşmek zorunda. Tek ayrışan kısa süreli avantaj yakalar.",
      objective: "Pazar sırasında ortak plan kur, sonra bu plana sadık kalıp kalmayacağına gizlice karar ver.",
      rules: ["Herkes aynı planı seçerse kişi başı +4 Nüfuz.", "Yalnız bir kişi ayrışırsa ayrışan +2 ve -1 Güven; diğerleri +1 ve ona karşı Koz kazanır.", "Birden fazla ayrışma varsa koalisyon çöker ve kimse kazanmaz."],
      negotiationTip: "Planın kendisinden çok, kimin planı bozacağı önemlidir. Özel görüşmelerde çapraz sözler al.",
    },
  },
  en: {
    "single-veto": { name: "Single Veto", description: "A shared Influence pool is on the table. Everyone secretly votes YES or NO.", objective: "Secure unanimous approval or become the only NO vote and take the private reward.", rules: ["No NO votes: split the pool equally.", "One NO vote: only the veto player gains 2 Influence.", "Two or more NO votes: the pool burns and each NO voter loses 1 Trust."], negotiationTip: "A veto is valuable only when you are the sole dissenter. Measure every promise carefully." },
    "paired-confrontation": { name: "Paired Confrontation", description: "Two selected players secretly choose Loyalty or Betrayal.", objective: "Balance immediate Influence against long-term Trust and Leverage.", rules: ["Both Loyal: +3 Influence each.", "One Betrays: betrayer +6, loyal player -1 and gains Leverage on the betrayer.", "Both Betray: both lose 1 Influence and 1 Trust."], negotiationTip: "Betrayal pays more now, but leaves a weapon that can be used in the final reveal." },
    "coalition-negotiation": { name: "Coalition Negotiation", description: "The coalition must converge on one division plan. A lone dissenter can profit briefly.", objective: "Build a shared plan during the Market, then secretly decide whether to honor it.", rules: ["Everyone matches: +4 Influence each.", "One dissenter: dissenter +2 and -1 Trust; others +1 and gain Leverage.", "Multiple splits: the coalition collapses and nobody gains."], negotiationTip: "The plan matters less than who might break it. Collect overlapping promises in private." },
  },
};

const choiceCopies: Record<Language, Record<string, string>> = {
  tr: { yes: "EVET", no: "HAYIR", loyalty: "SADAKAT", betrayal: "İHANET", "plan-a": "PLAN A", "plan-b": "PLAN B", "plan-c": "PLAN C" },
  en: { yes: "YES", no: "NO", loyalty: "LOYALTY", betrayal: "BETRAYAL", "plan-a": "PLAN A", "plan-b": "PLAN B", "plan-c": "PLAN C" },
};

const choiceDescriptions: Record<Language, Record<string, string>> = {
  tr: { yes: "Ortak havuzu onayla.", no: "Havuzu gizlice veto et.", loyalty: "Anlaşmaya sadık kal.", betrayal: "Büyük ödül için anlaşmayı boz.", "plan-a": "Birinci bölüşüm planını destekle.", "plan-b": "İkinci bölüşüm planını destekle.", "plan-c": "Üçüncü bölüşüm planını destekle." },
  en: { yes: "Approve the shared pool.", no: "Secretly veto the pool.", loyalty: "Honor the agreement.", betrayal: "Break the deal for the larger reward.", "plan-a": "Support the first division plan.", "plan-b": "Support the second division plan.", "plan-c": "Support the third division plan." },
};

const outcomes: Record<Language, Record<string, string>> = {
  tr: {
    "veto-approved": "Kimse veto kullanmadı. Havuz kulüp üyeleri arasında paylaşıldı.",
    "single-veto": "Tek bir veto çıktı. Ortak havuz yandı ve veto sahibi gizli ödülü aldı.",
    "multiple-veto": "Birden fazla veto çıktı. Havuz yandı ve veto sahipleri Güven kaybetti.",
    "mutual-loyalty": "İki taraf da sözünde durdu ve birlikte kazandı.",
    "mutual-betrayal": "İki taraf da ihanet etti; Nüfuz ve Güven kaybettiler.",
    "one-betrayal": "Tek taraflı ihanet gerçekleşti. Mağdur, ihanete karşı bir Koz kazandı.",
    "coalition-agreement": "Koalisyon tek planda birleşti ve havuzu korudu.",
    "coalition-dissenter": "Bir oyuncu koalisyondan ayrıştı. Diğer üyeler bu ihanetin Kozunu aldı.",
    "coalition-collapse": "Planlar parçalandı ve koalisyonun Nüfuzu kayboldu.",
  },
  en: {
    "veto-approved": "Nobody vetoed. The pool was shared among the club.",
    "single-veto": "A single veto burned the pool and claimed the private reward.",
    "multiple-veto": "Multiple vetoes burned the pool and cost their owners Trust.",
    "mutual-loyalty": "Both sides honored the deal and profited together.",
    "mutual-betrayal": "Both sides betrayed and lost Influence and Trust.",
    "one-betrayal": "One-sided betrayal occurred. The victim gained Leverage against the betrayer.",
    "coalition-agreement": "The coalition united behind one plan and protected the pool.",
    "coalition-dissenter": "One player broke away. The coalition gained Leverage on the dissenter.",
    "coalition-collapse": "The plans fractured and the coalition lost its Influence.",
  },
};

export const abilityCopy: Record<Language, Record<AbilityId, { name: string; description: string }>> = {
  tr: {
    ear: { name: "Kulak", description: "Özel görüşmeleri ve kimlerin sık sık buluştuğunu takip ederek bilgi üstünlüğü kur." },
    disinformant: { name: "Dezenformatör", description: "Görüşme içerikleri hakkında inandırıcı bir anlatı üret; doğru olduğunu kanıtlamak zorunda değilsin." },
    notary: { name: "Noterlik", description: "Anlaşmalara tanıklık et, verilen sözleri kaydet ve bozulan sözleri kamuoyuna taşı." },
    vault: { name: "Kasa", description: "Kozlarını sakla, varlığını abart ve rakiplerini elinde ne olduğunu tahmin etmeye zorla." },
    detective: { name: "Dedektif", description: "Özel görüşme trafiğini ve büyük Nüfuz değişimlerini okuyarak masanın gerçek dengesini çöz." },
  },
  en: {
    ear: { name: "The Ear", description: "Track private meetings and repeated alliances to build an information advantage." },
    disinformant: { name: "Disinformant", description: "Create a believable account of private talks without having to prove it is true." },
    notary: { name: "Notary", description: "Witness agreements, remember promises, and expose broken terms to the table." },
    vault: { name: "Vault", description: "Protect your Leverage, exaggerate what you hold, and force rivals to guess." },
    detective: { name: "Detective", description: "Read meeting traffic and major Influence swings to uncover the table's real balance." },
  },
};

export function getTaskCopy(task: PublicTask, language: Language): TaskCopy {
  return taskCopies[language][task.id] ?? { name: task.name, description: task.description, objective: task.description, rules: [], negotiationTip: "" };
}

export function getChoiceLabel(choice: GameChoice | { id: string; label: string }, language: Language): string {
  return choiceCopies[language][choice.id] ?? choice.label;
}

export function getChoiceDescription(choice: GameChoice, language: Language): string {
  return choiceDescriptions[language][choice.id] ?? choice.description ?? "";
}

export function getPrivateHint(task: PublicTask): string | undefined {
  return task.privateHint;
}

export function getRoleLabel(role: string | undefined, isBot: boolean, language: Language): string {
  if (isBot) return language === "tr" ? "Kasa Botu" : "House Bot";
  return role ?? (language === "tr" ? "Kulüp üyesi" : "Club member");
}

export function getOutcomeText(result: RoundResult, language: Language): string {
  return outcomes[language][result.outcomeId] ?? result.summary;
}
