export const months = [
  "جانفي",
  "فيفري",
  "مارس",
  "أفريل",
  "ماي",
  "جوان",
  "جويلية",
  "أوت",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const selectClass = "wz-input px-3";

// Champs en arabe : le champ date natif s'affiche dans la langue du navigateur.
export function BirthDateField() {
  return (
    <fieldset>
      <legend className="mb-1 block text-base font-bold text-ink">تاريخ الميلاد</legend>
      <div className="grid grid-cols-3 gap-2">
        <select name="birthDay" aria-label="اليوم" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            اليوم
          </option>
          {Array.from({ length: 31 }, (_, index) => (
            <option key={index} value={index + 1}>
              {index + 1}
            </option>
          ))}
        </select>
        <select name="birthMonth" aria-label="الشهر" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            الشهر
          </option>
          {months.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
        <input
          name="birthYear"
          aria-label="السنة"
          placeholder="السنة"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          required
          dir="ltr"
          className={`${selectClass} text-center placeholder:text-ink-soft`}
        />
      </div>
    </fieldset>
  );
}
