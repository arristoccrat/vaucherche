// Bulgarian cities a "local only" shop can be tied to (shops.city, sql/012).
// The key is what the database and the ?grad= filter store; the label is
// shown. Keys are Latin and never change.
export const CITIES = [
  { key: "sofia", label: "София" },
  { key: "plovdiv", label: "Пловдив" },
  { key: "varna", label: "Варна" },
  { key: "burgas", label: "Бургас" },
  { key: "ruse", label: "Русе" },
  { key: "stara-zagora", label: "Стара Загора" },
  { key: "pleven", label: "Плевен" },
  { key: "sliven", label: "Сливен" },
  { key: "dobrich", label: "Добрич" },
  { key: "shumen", label: "Шумен" },
  { key: "pernik", label: "Перник" },
  { key: "haskovo", label: "Хасково" },
  { key: "yambol", label: "Ямбол" },
  { key: "pazardzhik", label: "Пазарджик" },
  { key: "blagoevgrad", label: "Благоевград" },
  { key: "veliko-tarnovo", label: "Велико Търново" },
  { key: "vratsa", label: "Враца" },
  { key: "gabrovo", label: "Габрово" },
  { key: "asenovgrad", label: "Асеновград" },
  { key: "vidin", label: "Видин" },
  { key: "kazanlak", label: "Казанлък" },
  { key: "kyustendil", label: "Кюстендил" },
  { key: "kardzhali", label: "Кърджали" },
  { key: "montana", label: "Монтана" },
  { key: "dimitrovgrad", label: "Димитровград" },
  { key: "lovech", label: "Ловеч" },
  { key: "targovishte", label: "Търговище" },
  { key: "silistra", label: "Силистра" },
  { key: "razgrad", label: "Разград" },
  { key: "smolyan", label: "Смолян" },
  { key: "dupnitsa", label: "Дупница" },
  { key: "gorna-oryahovitsa", label: "Горна Оряховица" },
  { key: "petrich", label: "Петрич" },
  { key: "sandanski", label: "Сандански" },
  { key: "bansko", label: "Банско" },
  { key: "borovets", label: "Боровец" },
  { key: "pamporovo", label: "Пампорово" },
  { key: "velingrad", label: "Велинград" },
  { key: "nesebar", label: "Несебър" },
  { key: "sozopol", label: "Созопол" },
  { key: "pomorie", label: "Поморие" },
  { key: "balchik", label: "Балчик" },
  { key: "sunny-beach", label: "Слънчев бряг" },
  { key: "golden-sands", label: "Златни пясъци" },
  { key: "hisarya", label: "Хисаря" },
  { key: "samokov", label: "Самоков" },
] as const;
export type CityKey = (typeof CITIES)[number]["key"];

export function findCity(key: string | null | undefined) {
  return key ? CITIES.find((c) => c.key === key) : undefined;
}

// "в Пловдив", "във Враца" / "във Варна" (във before в or ф).
export function inCity(label: string) {
  return /^[вфВФ]/.test(label) ? `във ${label}` : `в ${label}`;
}

// How a local shop serves its city (shops.local_kind, sql/014).
export const LOCAL_KINDS = [
  { key: "on_site", label: "Ползва се на място в обекта", detail: "ползва се на място в обекта" },
  { key: "delivery", label: "Доставка само в града", detail: "доставка само в града" },
  { key: "both", label: "На място и с доставка в града", detail: "на място в обекта или с доставка в града" },
] as const;
export type LocalKind = (typeof LOCAL_KINDS)[number]["key"];

export function localDetail(kind: string | null | undefined) {
  return (LOCAL_KINDS.find((k) => k.key === kind) ?? LOCAL_KINDS[0]).detail;
}

// What a shop's scope reads as on the site: "Само в Пловдив", "Само на
// място" (local but no city known), or nothing (online / the whole country).
export function localLabel(localOnly: boolean | null | undefined, city: string | null | undefined) {
  if (!localOnly) return null;
  const found = findCity(city);
  return found ? `Само ${inCity(found.label)}` : "Само на място";
}
