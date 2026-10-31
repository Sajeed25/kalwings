/**
 * Practice tests. Written and reviewed in code (not editable by users), so every question and explanation is checked before release.
 * They are for self-practice: not certificates, never ranked, never shown to employers. Answers are never sent to the browser before grading.
 */
export type Question = { q: string; options: [string, string, string, string]; answer: 0 | 1 | 2 | 3; why: string };
export type PracticeTest = { slug: string; title: string; topic: string; blurb: string; questions: Question[] };

export const TESTS: PracticeTest[] = [
  { slug: "python-basics", title: "Python basics", topic: "Programming", blurb: "Core syntax and built-ins every Python role expects.", questions: [
    { q: "What does len([1, 2, 3]) return?", options: ["2", "3", "4", "It raises an error"], answer: 1, why: "len counts the items in the list: there are three." },
    { q: "Which of these is a dictionary literal?", options: ["[\"a\", 1]", "(\"a\", 1)", "{\"a\": 1}", "{1, 2}"], answer: 2, why: "Curly braces with key: value pairs make a dict. {1, 2} is a set; [] is a list; () is a tuple." },
    { q: "What is printed by print(2 ** 3)?", options: ["6", "5", "9", "8"], answer: 3, why: "** is the power operator: 2 to the power 3 is 8." },
    { q: "What does \"hello\".upper() return?", options: ["HELLO", "Hello", "hello", "It changes the original string"], answer: 0, why: "upper returns a new string in capitals. Strings are immutable, so the original is unchanged." },
    { q: "Which keyword starts a normal function definition?", options: ["func", "function", "def", "fn"], answer: 2, why: "Python uses def, as in def add(a, b):." },
    { q: "What does list(range(3)) give?", options: ["[1, 2, 3]", "[0, 1, 2]", "[0, 1, 2, 3]", "[3]"], answer: 1, why: "range(3) counts from 0 up to, but not including, 3." },
    { q: "Which statement about tuples is true?", options: ["They can be changed after creation", "They are immutable", "They can only hold numbers", "They are the same as dictionaries"], answer: 1, why: "A tuple cannot be changed after it is created; a list can." },
    { q: "What is the value of 10 // 3?", options: ["3.33", "4", "3", "1"], answer: 2, why: "// is floor division: 10 divided by 3 is 3.33, rounded down to 3. (10 % 3 is the remainder, 1.)" },
  ] },
  { slug: "sql-basics", title: "SQL basics", topic: "Data", blurb: "Querying and shaping data with SELECT.", questions: [
    { q: "Which clause filters rows before grouping?", options: ["HAVING", "ORDER BY", "WHERE", "LIMIT"], answer: 2, why: "WHERE filters individual rows. HAVING filters groups after GROUP BY." },
    { q: "How do you return each distinct city only once?", options: ["SELECT UNIQUE city FROM t", "SELECT DISTINCT city FROM t", "SELECT ONLY city FROM t", "SELECT city FROM t GROUP"], answer: 1, why: "DISTINCT removes duplicate rows from the result." },
    { q: "Which statement adds a new row to a table?", options: ["INSERT INTO", "ADD ROW", "UPDATE", "CREATE ROW"], answer: 0, why: "INSERT INTO table (columns) VALUES (...) adds a row. UPDATE changes existing rows." },
    { q: "Which expression counts every row in a table?", options: ["SUM(*)", "COUNT(*)", "TOTAL(*)", "ROWS(*)"], answer: 1, why: "COUNT(*) returns the number of rows." },
    { q: "What does ORDER BY salary DESC do?", options: ["Sorts lowest salary first", "Deletes the salary column", "Sorts highest salary first", "Groups rows by salary"], answer: 2, why: "DESC means descending, so the largest values come first." },
    { q: "Which join returns only rows that match in both tables?", options: ["LEFT JOIN", "INNER JOIN", "FULL JOIN", "CROSS JOIN"], answer: 1, why: "INNER JOIN keeps only matching rows. LEFT JOIN also keeps unmatched rows from the left table." },
    { q: "Which clause filters groups after GROUP BY?", options: ["WHERE", "FILTER", "HAVING", "WHEN"], answer: 2, why: "HAVING works on aggregated groups, for example HAVING COUNT(*) > 5." },
    { q: "In MySQL, what does SELECT * FROM t LIMIT 5 return?", options: ["Exactly 5 rows, always", "At most 5 rows", "Every row except 5", "The 5th row only"], answer: 1, why: "LIMIT caps the number of rows. If the table has fewer than 5, you get fewer." },
  ] },
  { slug: "javascript-basics", title: "JavaScript basics", topic: "Programming", blurb: "Types, arrays and async: the questions interviews start with.", questions: [
    { q: "What does typeof null return?", options: ["\"null\"", "\"undefined\"", "\"object\"", "\"number\""], answer: 2, why: "A long-standing quirk of the language: typeof null is \"object\"." },
    { q: "What is the value of '5' === 5?", options: ["true", "false", "undefined", "It throws an error"], answer: 1, why: "=== compares type as well as value. A string and a number are different types." },
    { q: "What does declaring a variable with const mean?", options: ["Its object can never change inside", "The variable cannot be reassigned", "It is deleted after use", "It is only visible in loops"], answer: 1, why: "const prevents reassigning the variable. An object it points to can still have its properties changed." },
    { q: "What does [1, 2, 3].map(x => x * 2) return?", options: ["[2, 4, 6]", "[1, 2, 3]", "6", "[1, 4, 9]"], answer: 0, why: "map returns a new array with the function applied to each item." },
    { q: "Which array method adds an item to the end?", options: ["pop", "shift", "unshift", "push"], answer: 3, why: "push adds to the end; pop removes from the end; unshift adds to the start." },
    { q: "What does console.log(0.1 + 0.2 === 0.3) print?", options: ["true", "false", "NaN", "undefined"], answer: 1, why: "Floating-point numbers cannot represent 0.1 and 0.2 exactly, so the sum is 0.30000000000000004." },
    { q: "What does JSON.parse('{\"a\":1}').a evaluate to?", options: ["\"a\"", "undefined", "{\"a\":1}", "1"], answer: 3, why: "JSON.parse turns the text into an object whose property a is 1." },
    { q: "What does an async function always return?", options: ["A Promise", "undefined", "A callback", "A string"], answer: 0, why: "Even if you return a plain value, an async function wraps it in a Promise." },
  ] },
  { slug: "aptitude-basics", title: "Aptitude basics", topic: "Aptitude", blurb: "Percentages, averages, series and ratios for campus tests.", questions: [
    { q: "What is 20% of 250?", options: ["25", "40", "50", "60"], answer: 2, why: "20/100 x 250 = 50." },
    { q: "What is the average of 12, 18 and 24?", options: ["16", "18", "20", "54"], answer: 1, why: "(12 + 18 + 24) / 3 = 54 / 3 = 18." },
    { q: "What comes next in the series 2, 6, 12, 20, ?", options: ["28", "30", "32", "26"], answer: 1, why: "The gaps are 4, 6, 8, 10, so the next gap is 10: 20 + 10 = 30." },
    { q: "If 5 pens cost ₹60, what do 8 pens cost?", options: ["₹80", "₹90", "₹96", "₹100"], answer: 2, why: "One pen costs ₹12, so 8 pens cost ₹96." },
    { q: "A 120 m long train passes a pole in 6 seconds. What is its speed in metres per second?", options: ["20", "18", "24", "12"], answer: 0, why: "Speed = distance / time = 120 / 6 = 20 m/s (72 km/h)." },
    { q: "What is the simple interest on ₹5,000 at 8% a year for 2 years?", options: ["₹400", "₹800", "₹1,000", "₹1,600"], answer: 1, why: "SI = P x R x T / 100 = 5000 x 8 x 2 / 100 = ₹800." },
    { q: "Which number is the odd one out: 2, 3, 5, 9, 11?", options: ["2", "3", "9", "11"], answer: 2, why: "All the others are prime numbers; 9 = 3 x 3 is not." },
    { q: "Boys and girls in a class are in the ratio 2:3. If there are 30 students, how many are boys?", options: ["10", "12", "15", "18"], answer: 1, why: "Boys are 2 of 5 parts: 2/5 x 30 = 12." },
  ] },
];

export const testBySlug = (slug: string) => TESTS.find((t) => t.slug === slug);

/** What the browser may see before grading: no answers, no explanations. */
export const forTaking = (t: PracticeTest) => ({ slug: t.slug, title: t.title, topic: t.topic, blurb: t.blurb, questions: t.questions.map((q) => ({ q: q.q, options: q.options })) });

export type ReviewItem = { q: string; options: string[]; chosen: number | null; correct: number; right: boolean; why: string };
/** Grades one attempt on the server. `chosen` holds one option index (or null for skipped) per question. */
export function grade(t: PracticeTest, chosen: (number | null)[]): { score: number; total: number; review: ReviewItem[] } {
  const review = t.questions.map((q, i) => { const c = chosen[i] ?? null; const ok = Number.isInteger(c) && c! >= 0 && c! <= 3 ? c : null; return { q: q.q, options: [...q.options], chosen: ok, correct: q.answer, right: ok === q.answer, why: q.why }; });
  return { score: review.filter((r) => r.right).length, total: t.questions.length, review };
}
