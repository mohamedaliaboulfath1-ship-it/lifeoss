/** Professional reading library seed — محمد علي · 50 planned books */

export const MOHAMED_LIBRARY_SEED_TAG = "mohamed_library_v1";

export const LIBRARY_CATEGORIES = {
  SELF_DEVELOPMENT: "Self Development",
  PRODUCTIVITY: "Productivity",
  LEADERSHIP: "Leadership",
  PERSONAL_FINANCE: "Personal Finance",
  FINANCIAL_ANALYSIS: "Financial Analysis",
  PSYCHOLOGY: "Psychology & Decision Making",
  COMMUNICATION: "Communication",
  BIOGRAPHY: "Biography",
  INVESTMENT: "Investment",
} as const;

export type LibraryBookSeed = {
  id: string;
  title: string;
  author: string;
  category: string;
  language: string;
  pages: number;
  coverUrl: string;
  isbn?: string;
  publishYear: number;
  goodreadsRating: number;
  description: string;
  estimatedReadingHours: number;
  purchaseUrl?: string;
  priority: "high" | "med" | "low";
  readingPhase: number;
  readingPlanOrder: number;
  tags?: string[];
};

const OL = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
const AMZ = (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;

function hrs(pages: number) {
  return Math.max(3, Math.round(pages / 40));
}

const HIGH_TITLES = new Set([
  "atomic habits",
  "deep work",
  "the psychology of money",
  "the richest man in babylon",
  "financial statement analysis",
  "financial modeling",
  "investment banking",
  "valuation",
  "thinking, fast and slow",
]);

function priorityFor(title: string, category: string, phase: number): "high" | "med" | "low" {
  const key = title.toLowerCase();
  if (HIGH_TITLES.has(key)) return "high";
  if (category === LIBRARY_CATEGORIES.BIOGRAPHY) return "low";
  if (category === LIBRARY_CATEGORIES.LEADERSHIP || category === LIBRARY_CATEGORIES.PRODUCTIVITY) return "med";
  if (category === LIBRARY_CATEGORIES.COMMUNICATION) return "med";
  if (phase <= 3) return "high";
  if (category === LIBRARY_CATEGORIES.INVESTMENT) return "med";
  return "low";
}

function phaseFor(category: string, title: string): { phase: number; order: number } {
  const t = title.toLowerCase();
  if (["atomic habits", "deep work", "the psychology of money", "the richest man in babylon"].some((x) => t.includes(x) || x.includes(t))) {
    const order = ["atomic habits", "deep work", "the psychology of money", "the richest man in babylon"].findIndex((x) => t.includes(x.split(" ")[0]));
    return { phase: 1, order: order >= 0 ? order + 1 : 1 };
  }
  if (t.includes("financial statement analysis") || t.includes("financial modeling") || t.includes("investment banking")) {
    const order = t.includes("statement") ? 1 : t.includes("modeling") ? 2 : 3;
    return { phase: 2, order };
  }
  if (t.includes("valuation") || t.includes("corporate finance") || t.includes("principles of corporate finance")) {
    const order = t.includes("principles") ? 3 : t.includes("valuation") ? 1 : 2;
    return { phase: 3, order };
  }
  if (category === LIBRARY_CATEGORIES.LEADERSHIP || category === LIBRARY_CATEGORIES.COMMUNICATION) {
    return { phase: 4, order: 10 };
  }
  if (category === LIBRARY_CATEGORIES.INVESTMENT) {
    return { phase: 5, order: 10 };
  }
  return { phase: 6, order: 20 };
}

type RawBook = Omit<LibraryBookSeed, "priority" | "readingPhase" | "readingPlanOrder"> & {
  priority?: "high" | "med" | "low";
  readingPhase?: number;
  readingPlanOrder?: number;
};

const RAW: RawBook[] = [
  // Self Development
  { id: "lib_book_atomic_habits", title: "Atomic Habits", author: "James Clear", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 320, isbn: "9780735211292", coverUrl: OL("9780735211292"), publishYear: 2018, goodreadsRating: 4.36, description: "Tiny changes, remarkable results — a practical framework for building good habits and breaking bad ones.", estimatedReadingHours: hrs(320), purchaseUrl: AMZ("Atomic Habits James Clear"), priority: "high", readingPhase: 1, readingPlanOrder: 1 },
  { id: "lib_book_7_habits", title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 381, isbn: "9781982137274", coverUrl: OL("9781982137274"), publishYear: 1989, goodreadsRating: 4.15, description: "Principle-centered approach to personal and professional effectiveness.", estimatedReadingHours: hrs(381), purchaseUrl: AMZ("7 Habits Stephen Covey") },
  { id: "lib_book_deep_work", title: "Deep Work", author: "Cal Newport", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 296, isbn: "9781455586691", coverUrl: OL("9781455586691"), publishYear: 2016, goodreadsRating: 4.19, description: "Rules for focused success in a distracted world.", estimatedReadingHours: hrs(296), purchaseUrl: AMZ("Deep Work Cal Newport"), priority: "high", readingPhase: 1, readingPlanOrder: 2 },
  { id: "lib_book_compound_effect", title: "The Compound Effect", author: "Darren Hardy", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 192, isbn: "9781593157241", coverUrl: OL("9781593157241"), publishYear: 2010, goodreadsRating: 4.24, description: "Multiplying your success one simple step at a time.", estimatedReadingHours: hrs(192), purchaseUrl: AMZ("Compound Effect Darren Hardy") },
  { id: "lib_book_slight_edge", title: "The Slight Edge", author: "Jeff Olson", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 280, isbn: "9781626340466", coverUrl: OL("9781626340466"), publishYear: 2005, goodreadsRating: 4.28, description: "Turning simple disciplines into massive success.", estimatedReadingHours: hrs(280), purchaseUrl: AMZ("Slight Edge Jeff Olson") },
  { id: "lib_book_essentialism", title: "Essentialism", author: "Greg McKeown", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 272, isbn: "9780804137386", coverUrl: OL("9780804137386"), publishYear: 2014, goodreadsRating: 4.05, description: "The disciplined pursuit of less.", estimatedReadingHours: hrs(272), purchaseUrl: AMZ("Essentialism Greg McKeown") },
  { id: "lib_book_one_thing", title: "The One Thing", author: "Gary Keller", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 240, isbn: "9781885167774", coverUrl: OL("9781885167774"), publishYear: 2013, goodreadsRating: 4.13, description: "The surprisingly simple truth behind extraordinary results.", estimatedReadingHours: hrs(240), purchaseUrl: AMZ("The One Thing Gary Keller") },
  { id: "lib_book_cant_hurt_me", title: "Can't Hurt Me", author: "David Goggins", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 364, isbn: "9781544512273", coverUrl: OL("9781544512273"), publishYear: 2018, goodreadsRating: 4.36, description: "Master your mind and defy the odds.", estimatedReadingHours: hrs(364), purchaseUrl: AMZ("Can't Hurt Me David Goggins") },
  { id: "lib_book_mountain_is_you", title: "The Mountain Is You", author: "Brianna Wiest", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 248, isbn: "9781949759228", coverUrl: OL("9781949759228"), publishYear: 2020, goodreadsRating: 4.12, description: "Transforming self-sabotage into self-mastery.", estimatedReadingHours: hrs(248), purchaseUrl: AMZ("Mountain Is You Brianna Wiest") },
  { id: "lib_book_make_your_bed", title: "Make Your Bed", author: "William H. McRaven", category: LIBRARY_CATEGORIES.SELF_DEVELOPMENT, language: "en", pages: 130, isbn: "9781455570249", coverUrl: OL("9781455570249"), publishYear: 2017, goodreadsRating: 4.10, description: "Little things that can change your life and maybe the world.", estimatedReadingHours: hrs(130), purchaseUrl: AMZ("Make Your Bed McRaven") },
  // Productivity
  { id: "lib_book_gtd", title: "Getting Things Done", author: "David Allen", category: LIBRARY_CATEGORIES.PRODUCTIVITY, language: "en", pages: 352, isbn: "9780143126560", coverUrl: OL("9780143126560"), publishYear: 2001, goodreadsRating: 4.01, description: "The art of stress-free productivity.", estimatedReadingHours: hrs(352), purchaseUrl: AMZ("Getting Things Done David Allen") },
  { id: "lib_book_four_thousand_weeks", title: "Four Thousand Weeks", author: "Oliver Burkeman", category: LIBRARY_CATEGORIES.PRODUCTIVITY, language: "en", pages: 288, isbn: "9780374159122", coverUrl: OL("9780374159122"), publishYear: 2021, goodreadsRating: 4.15, description: "Time management for mortals.", estimatedReadingHours: hrs(288), purchaseUrl: AMZ("Four Thousand Weeks Oliver Burkeman") },
  { id: "lib_book_eat_that_frog", title: "Eat That Frog!", author: "Brian Tracy", category: LIBRARY_CATEGORIES.PRODUCTIVITY, language: "en", pages: 144, isbn: "9781576754221", coverUrl: OL("9781576754221"), publishYear: 2001, goodreadsRating: 3.88, description: "21 great ways to stop procrastinating.", estimatedReadingHours: hrs(144), purchaseUrl: AMZ("Eat That Frog Brian Tracy") },
  { id: "lib_book_indistractable", title: "Indistractable", author: "Nir Eyal", category: LIBRARY_CATEGORIES.PRODUCTIVITY, language: "en", pages: 272, isbn: "9781948836531", coverUrl: OL("9781948836531"), publishYear: 2019, goodreadsRating: 4.04, description: "How to control your attention and choose your life.", estimatedReadingHours: hrs(272), purchaseUrl: AMZ("Indistractable Nir Eyal") },
  { id: "lib_book_hyperfocus", title: "Hyperfocus", author: "Chris Bailey", category: LIBRARY_CATEGORIES.PRODUCTIVITY, language: "en", pages: 256, isbn: "9780525533861", coverUrl: OL("9780525533861"), publishYear: 2018, goodreadsRating: 3.88, description: "How to be more productive in a world of distraction.", estimatedReadingHours: hrs(256), purchaseUrl: AMZ("Hyperfocus Chris Bailey") },
  // Leadership
  { id: "lib_book_leaders_eat_last", title: "Leaders Eat Last", author: "Simon Sinek", category: LIBRARY_CATEGORIES.LEADERSHIP, language: "en", pages: 368, isbn: "9781591845324", coverUrl: OL("9781591845324"), publishYear: 2014, goodreadsRating: 4.10, description: "Why some teams pull together and others don't.", estimatedReadingHours: hrs(368), purchaseUrl: AMZ("Leaders Eat Last Simon Sinek") },
  { id: "lib_book_start_with_why", title: "Start With Why", author: "Simon Sinek", category: LIBRARY_CATEGORIES.LEADERSHIP, language: "en", pages: 256, isbn: "9781591846444", coverUrl: OL("9781591846444"), publishYear: 2009, goodreadsRating: 4.09, description: "How great leaders inspire everyone to take action.", estimatedReadingHours: hrs(256), purchaseUrl: AMZ("Start With Why Simon Sinek") },
  { id: "lib_book_extreme_ownership", title: "Extreme Ownership", author: "Jocko Willink", category: LIBRARY_CATEGORIES.LEADERSHIP, language: "en", pages: 320, isbn: "9781250067050", coverUrl: OL("9781250067050"), publishYear: 2015, goodreadsRating: 4.25, description: "How U.S. Navy SEALs lead and win.", estimatedReadingHours: hrs(320), purchaseUrl: AMZ("Extreme Ownership Jocko Willink") },
  { id: "lib_book_five_dysfunctions", title: "The Five Dysfunctions of a Team", author: "Patrick Lencioni", category: LIBRARY_CATEGORIES.LEADERSHIP, language: "en", pages: 229, isbn: "9780787960759", coverUrl: OL("9780787960759"), publishYear: 2002, goodreadsRating: 4.22, description: "A leadership fable about team dysfunction.", estimatedReadingHours: hrs(229), purchaseUrl: AMZ("Five Dysfunctions Team Lencioni") },
  { id: "lib_book_good_to_great", title: "Good to Great", author: "Jim Collins", category: LIBRARY_CATEGORIES.LEADERSHIP, language: "en", pages: 300, isbn: "9780066620992", coverUrl: OL("9780066620992"), publishYear: 2001, goodreadsRating: 4.12, description: "Why some companies make the leap and others don't.", estimatedReadingHours: hrs(300), purchaseUrl: AMZ("Good to Great Jim Collins") },
  { id: "lib_book_first_90_days", title: "The First 90 Days", author: "Michael Watkins", category: LIBRARY_CATEGORIES.LEADERSHIP, language: "en", pages: 288, isbn: "9781422188610", coverUrl: OL("9781422188610"), publishYear: 2003, goodreadsRating: 4.05, description: "Proven strategies for getting up to speed faster.", estimatedReadingHours: hrs(288), purchaseUrl: AMZ("First 90 Days Michael Watkins") },
  { id: "lib_book_multipliers", title: "Multipliers", author: "Liz Wiseman", category: LIBRARY_CATEGORIES.LEADERSHIP, language: "en", pages: 288, isbn: "9780061964396", coverUrl: OL("9780061964396"), publishYear: 2010, goodreadsRating: 4.05, description: "How the best leaders make everyone smarter.", estimatedReadingHours: hrs(288), purchaseUrl: AMZ("Multipliers Liz Wiseman") },
  // Communication
  { id: "lib_book_how_to_win_friends", title: "How to Win Friends and Influence People", author: "Dale Carnegie", category: LIBRARY_CATEGORIES.COMMUNICATION, language: "en", pages: 288, isbn: "9780671027032", coverUrl: OL("9780671027032"), publishYear: 1936, goodreadsRating: 4.22, description: "The classic guide to interpersonal skills.", estimatedReadingHours: hrs(288), purchaseUrl: AMZ("How to Win Friends Dale Carnegie") },
  { id: "lib_book_never_split", title: "Never Split the Difference", author: "Chris Voss", category: LIBRARY_CATEGORIES.COMMUNICATION, language: "en", pages: 274, isbn: "9780062407801", coverUrl: OL("9780062407801"), publishYear: 2016, goodreadsRating: 4.36, description: "Negotiating as if your life depended on it.", estimatedReadingHours: hrs(274), purchaseUrl: AMZ("Never Split the Difference Chris Voss") },
  { id: "lib_book_crucial_conversations", title: "Crucial Conversations", author: "Kerry Patterson", category: LIBRARY_CATEGORIES.COMMUNICATION, language: "en", pages: 272, isbn: "9780071401944", coverUrl: OL("9780071401944"), publishYear: 2002, goodreadsRating: 4.18, description: "Tools for talking when stakes are high.", estimatedReadingHours: hrs(272), purchaseUrl: AMZ("Crucial Conversations") },
  { id: "lib_book_influence", title: "Influence", author: "Robert Cialdini", category: LIBRARY_CATEGORIES.COMMUNICATION, language: "en", pages: 320, isbn: "9780061241890", coverUrl: OL("9780061241890"), publishYear: 1984, goodreadsRating: 4.19, description: "The psychology of persuasion.", estimatedReadingHours: hrs(320), purchaseUrl: AMZ("Influence Robert Cialdini") },
  { id: "lib_book_talk_like_ted", title: "Talk Like TED", author: "Carmine Gallo", category: LIBRARY_CATEGORIES.COMMUNICATION, language: "en", pages: 272, isbn: "9781250041128", coverUrl: OL("9781250041128"), publishYear: 2014, goodreadsRating: 3.95, description: "The 9 public-speaking secrets of the world's top minds.", estimatedReadingHours: hrs(272), purchaseUrl: AMZ("Talk Like TED Carmine Gallo") },
  // Personal Finance
  { id: "lib_book_rich_dad", title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", category: LIBRARY_CATEGORIES.PERSONAL_FINANCE, language: "en", pages: 336, isbn: "9781612680194", coverUrl: OL("9781612680194"), publishYear: 1997, goodreadsRating: 4.11, description: "What the rich teach their kids about money.", estimatedReadingHours: hrs(336), purchaseUrl: AMZ("Rich Dad Poor Dad") },
  { id: "lib_book_richest_babylon", title: "The Richest Man in Babylon", author: "George S. Clason", category: LIBRARY_CATEGORIES.PERSONAL_FINANCE, language: "en", pages: 194, isbn: "9780451524756", coverUrl: OL("9780451524756"), publishYear: 1926, goodreadsRating: 4.25, description: "Timeless parables on wealth and thrift.", estimatedReadingHours: hrs(194), purchaseUrl: AMZ("Richest Man in Babylon"), priority: "high", readingPhase: 1, readingPlanOrder: 4 },
  { id: "lib_book_psychology_money", title: "The Psychology of Money", author: "Morgan Housel", category: LIBRARY_CATEGORIES.PERSONAL_FINANCE, language: "en", pages: 256, isbn: "9780857197689", coverUrl: OL("9780857197689"), publishYear: 2020, goodreadsRating: 4.29, description: "Timeless lessons on wealth, greed, and happiness.", estimatedReadingHours: hrs(256), purchaseUrl: AMZ("Psychology of Money Morgan Housel"), priority: "high", readingPhase: 1, readingPlanOrder: 3 },
  { id: "lib_book_iwt", title: "I Will Teach You To Be Rich", author: "Ramit Sethi", category: LIBRARY_CATEGORIES.PERSONAL_FINANCE, language: "en", pages: 352, isbn: "9781523505746", coverUrl: OL("9781523505746"), publishYear: 2009, goodreadsRating: 4.20, description: "No guilt, no excuses — a 6-week program.", estimatedReadingHours: hrs(352), purchaseUrl: AMZ("I Will Teach You To Be Rich") },
  { id: "lib_book_millionaire_next_door", title: "The Millionaire Next Door", author: "Thomas J. Stanley", category: LIBRARY_CATEGORIES.PERSONAL_FINANCE, language: "en", pages: 272, isbn: "9781589795471", coverUrl: OL("9781589795471"), publishYear: 1996, goodreadsRating: 4.06, description: "The surprising secrets of America's wealthy.", estimatedReadingHours: hrs(272), purchaseUrl: AMZ("Millionaire Next Door") },
  { id: "lib_book_your_money_life", title: "Your Money or Your Life", author: "Vicki Robin", category: LIBRARY_CATEGORIES.PERSONAL_FINANCE, language: "en", pages: 368, isbn: "9780143115762", coverUrl: OL("9780143115762"), publishYear: 1992, goodreadsRating: 4.12, description: "Transforming your relationship with money.", estimatedReadingHours: hrs(368), purchaseUrl: AMZ("Your Money or Your Life") },
  { id: "lib_book_simple_path_wealth", title: "The Simple Path to Wealth", author: "JL Collins", category: LIBRARY_CATEGORIES.PERSONAL_FINANCE, language: "en", pages: 286, isbn: "9781533667922", coverUrl: OL("9781533667922"), publishYear: 2016, goodreadsRating: 4.44, description: "Road map to financial independence.", estimatedReadingHours: hrs(286), purchaseUrl: AMZ("Simple Path to Wealth JL Collins") },
  // Investment
  { id: "lib_book_intelligent_investor", title: "The Intelligent Investor", author: "Benjamin Graham", category: LIBRARY_CATEGORIES.INVESTMENT, language: "en", pages: 623, isbn: "9780060555665", coverUrl: OL("9780060555665"), publishYear: 1949, goodreadsRating: 4.25, description: "The definitive book on value investing.", estimatedReadingHours: hrs(623), purchaseUrl: AMZ("Intelligent Investor Benjamin Graham"), tags: ["investment"] },
  { id: "lib_book_common_stocks", title: "Common Stocks and Uncommon Profits", author: "Philip Fisher", category: LIBRARY_CATEGORIES.INVESTMENT, language: "en", pages: 192, isbn: "9780471445500", coverUrl: OL("9780471445500"), publishYear: 1958, goodreadsRating: 4.20, description: "Qualitative growth investing classic.", estimatedReadingHours: hrs(192), purchaseUrl: AMZ("Common Stocks Uncommon Profits"), tags: ["investment"] },
  { id: "lib_book_one_up_wall_street", title: "One Up On Wall Street", author: "Peter Lynch", category: LIBRARY_CATEGORIES.INVESTMENT, language: "en", pages: 304, isbn: "9780743200403", coverUrl: OL("9780743200403"), publishYear: 1989, goodreadsRating: 4.20, description: "How to use what you already know to make money.", estimatedReadingHours: hrs(304), purchaseUrl: AMZ("One Up On Wall Street Peter Lynch"), tags: ["investment"] },
  { id: "lib_book_little_book_investing", title: "The Little Book of Common Sense Investing", author: "John C. Bogle", category: LIBRARY_CATEGORIES.INVESTMENT, language: "en", pages: 307, isbn: "9781119404507", coverUrl: OL("9781119404507"), publishYear: 2007, goodreadsRating: 4.25, description: "The only way to guarantee your fair share of stock market returns.", estimatedReadingHours: hrs(307), purchaseUrl: AMZ("Little Book Common Sense Investing Bogle"), tags: ["investment"] },
  { id: "lib_book_random_walk", title: "A Random Walk Down Wall Street", author: "Burton G. Malkiel", category: LIBRARY_CATEGORIES.INVESTMENT, language: "en", pages: 464, isbn: "9780393352245", coverUrl: OL("9780393352245"), publishYear: 1973, goodreadsRating: 4.08, description: "The time-tested strategy for successful investing.", estimatedReadingHours: hrs(464), purchaseUrl: AMZ("Random Walk Down Wall Street"), tags: ["investment"] },
  // Financial Analysis
  { id: "lib_book_fsa", title: "Financial Statement Analysis", author: "Martin Fridson", category: LIBRARY_CATEGORIES.FINANCIAL_ANALYSIS, language: "en", pages: 384, isbn: "9781119284311", coverUrl: OL("9781119284311"), publishYear: 2002, goodreadsRating: 4.05, description: "A practitioner's guide to financial statement analysis.", estimatedReadingHours: hrs(384), purchaseUrl: AMZ("Financial Statement Analysis Fridson"), priority: "high", readingPhase: 2, readingPlanOrder: 1 },
  { id: "lib_book_investment_banking", title: "Investment Banking", author: "Joshua Rosenbaum", category: LIBRARY_CATEGORIES.FINANCIAL_ANALYSIS, language: "en", pages: 816, isbn: "9781118729074", coverUrl: OL("9781118729074"), publishYear: 2013, goodreadsRating: 4.45, description: "Valuation, LBOs, M&A, and IPOs — the red book.", estimatedReadingHours: hrs(816), purchaseUrl: AMZ("Investment Banking Rosenbaum Pearl"), priority: "high", readingPhase: 2, readingPlanOrder: 3 },
  { id: "lib_book_financial_modeling", title: "Financial Modeling", author: "Simon Benninga", category: LIBRARY_CATEGORIES.FINANCIAL_ANALYSIS, language: "en", pages: 1144, isbn: "9780262027281", coverUrl: OL("9780262027281"), publishYear: 1997, goodreadsRating: 4.10, description: "Comprehensive guide to building financial models in Excel.", estimatedReadingHours: hrs(1144), purchaseUrl: AMZ("Financial Modeling Simon Benninga"), priority: "high", readingPhase: 2, readingPlanOrder: 2 },
  { id: "lib_book_valuation", title: "Valuation", author: "McKinsey & Company", category: LIBRARY_CATEGORIES.FINANCIAL_ANALYSIS, language: "en", pages: 896, isbn: "9781118873708", coverUrl: OL("9781118873708"), publishYear: 1990, goodreadsRating: 4.20, description: "Measuring and managing the value of companies.", estimatedReadingHours: hrs(896), purchaseUrl: AMZ("Valuation McKinsey"), priority: "high", readingPhase: 3, readingPlanOrder: 1 },
  { id: "lib_book_corporate_finance", title: "Corporate Finance", author: "Stephen Ross", category: LIBRARY_CATEGORIES.FINANCIAL_ANALYSIS, language: "en", pages: 1040, isbn: "9781259918940", coverUrl: OL("9781259918940"), publishYear: 1988, goodreadsRating: 4.05, description: "Core corporate finance textbook — Ross, Westerfield & Jordan.", estimatedReadingHours: hrs(1040), purchaseUrl: AMZ("Corporate Finance Ross Westerfield"), priority: "high", readingPhase: 3, readingPlanOrder: 2 },
  { id: "lib_book_principles_corp_finance", title: "Principles of Corporate Finance", author: "Richard Brealey", category: LIBRARY_CATEGORIES.FINANCIAL_ANALYSIS, language: "en", pages: 976, isbn: "9781259927645", coverUrl: OL("9781259927645"), publishYear: 1980, goodreadsRating: 4.12, description: "Brealey, Myers & Allen — global corporate finance standard.", estimatedReadingHours: hrs(976), purchaseUrl: AMZ("Principles Corporate Finance Brealey"), priority: "high", readingPhase: 3, readingPlanOrder: 3 },
  // Psychology
  { id: "lib_book_thinking_fast_slow", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: LIBRARY_CATEGORIES.PSYCHOLOGY, language: "en", pages: 499, isbn: "9780374533557", coverUrl: OL("9780374533557"), publishYear: 2011, goodreadsRating: 4.16, description: "Two systems that drive the way we think.", estimatedReadingHours: hrs(499), purchaseUrl: AMZ("Thinking Fast and Slow Kahneman"), priority: "high" },
  { id: "lib_book_predictably_irrational", title: "Predictably Irrational", author: "Dan Ariely", category: LIBRARY_CATEGORIES.PSYCHOLOGY, language: "en", pages: 384, isbn: "9780061353246", coverUrl: OL("9780061353246"), publishYear: 2008, goodreadsRating: 4.13, description: "The hidden forces that shape our decisions.", estimatedReadingHours: hrs(384), purchaseUrl: AMZ("Predictably Irrational Dan Ariely") },
  { id: "lib_book_power_of_habit", title: "The Power of Habit", author: "Charles Duhigg", category: LIBRARY_CATEGORIES.PSYCHOLOGY, language: "en", pages: 371, isbn: "9780812981605", coverUrl: OL("9780812981605"), publishYear: 2012, goodreadsRating: 4.13, description: "Why we do what we do in life and business.", estimatedReadingHours: hrs(371), purchaseUrl: AMZ("Power of Habit Charles Duhigg") },
  { id: "lib_book_mindset", title: "Mindset", author: "Carol S. Dweck", category: LIBRARY_CATEGORIES.PSYCHOLOGY, language: "en", pages: 320, isbn: "9780345472328", coverUrl: OL("9780345472328"), publishYear: 2006, goodreadsRating: 4.10, description: "The new psychology of success — fixed vs growth mindset.", estimatedReadingHours: hrs(320), purchaseUrl: AMZ("Mindset Carol Dweck") },
  // Biography
  { id: "lib_book_shoe_dog", title: "Shoe Dog", author: "Phil Knight", category: LIBRARY_CATEGORIES.BIOGRAPHY, language: "en", pages: 386, isbn: "9781501135910", coverUrl: OL("9781501135910"), publishYear: 2016, goodreadsRating: 4.46, description: "A memoir by the creator of Nike.", estimatedReadingHours: hrs(386), purchaseUrl: AMZ("Shoe Dog Phil Knight") },
];

export const MOHAMED_LIBRARY_BOOKS: LibraryBookSeed[] = RAW.map((book) => {
  const { phase, order } = phaseFor(book.category, book.title);
  return {
    ...book,
    readingPhase: book.readingPhase ?? phase,
    readingPlanOrder: book.readingPlanOrder ?? order,
    priority: book.priority ?? priorityFor(book.title, book.category, phase),
  };
}).sort((a, b) => {
  if (a.readingPhase !== b.readingPhase) return a.readingPhase - b.readingPhase;
  if (a.readingPlanOrder !== b.readingPlanOrder) return a.readingPlanOrder - b.readingPlanOrder;
  const prio = { high: 0, med: 1, low: 2 };
  if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority];
  return a.title.localeCompare(b.title);
});

export const READING_PLAN_PHASES = [
  { phase: 1, titleAr: "المرحلة 1 — الأساسيات", titleEn: "Foundations", description: "عادات، تركيز، وأساسيات المال الشخصي" },
  { phase: 2, titleAr: "المرحلة 2 — التحليل المالي", titleEn: "Financial Analysis Core", description: "القوائم، النمذجة، والاستثمار المصرفي" },
  { phase: 3, titleAr: "المرحلة 3 — التقييم والتمويل", titleEn: "Valuation & Corporate Finance", description: "تقييم الشركات ومبادئ التمويل" },
  { phase: 4, titleAr: "المرحلة 4 — القيادة والتواصل", titleEn: "Leadership & Communication", description: "بناء الفرق والتأثير" },
  { phase: 5, titleAr: "المرحلة 5 — الاستثمار", titleEn: "Investment Classics", description: "كلاسيكيات الاستثمار طويل الأجل" },
  { phase: 6, titleAr: "المرحلة 6 — التطوير والتكميل", titleEn: "Growth & Supplementary", description: "تطوير ذاتي، إنتاجية، وعلم النفس" },
] as const;
