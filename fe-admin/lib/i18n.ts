"use client";

import { usePrefs } from "./display-prefs";

const en = {
  appName: "Municipal Tax",
  portalName: "Admin Portal",
  navDashboard: "Dashboard",
  navUsers: "Users",
  navVerification: "Verification",
  navProperties: "Properties",
  navTaxRules: "Tax Rules",
  navAssessments: "Assessments",
  navBills: "Bills & Fines",
  navPayments: "Payments",
  navReceipts: "Receipts",
  navCategories: "Tax Categories",
  navReports: "Reports",
  navEmployees: "Employees",
  navAudit: "Audit Log",
  navProfile: "My Profile",
  search: "Search",
  searchPlaceholder: "Search pages…",
  searchEmpty: "No matching pages.",
  language: "Language",
  calendar: "Calendar",
  theme: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "System",
  account: "Account",
  logout: "Log out",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  breadcrumbHome: "Home",
};

const ne: typeof en = {
  appName: "नगरपालिका कर",
  portalName: "प्रशासन पोर्टल",
  navDashboard: "ड्यासबोर्ड",
  navUsers: "प्रयोगकर्ताहरू",
  navVerification: "प्रमाणीकरण",
  navProperties: "सम्पत्तिहरू",
  navTaxRules: "कर नियमहरू",
  navAssessments: "निर्धारणहरू",
  navBills: "बिल तथा जरिवाना",
  navPayments: "भुक्तानीहरू",
  navReceipts: "रसिदहरू",
  navCategories: "कर वर्गहरू",
  navReports: "प्रतिवेदनहरू",
  navEmployees: "कर्मचारीहरू",
  navAudit: "अडिट लग",
  navProfile: "मेरो प्रोफाइल",
  search: "खोज्नुहोस्",
  searchPlaceholder: "पृष्ठहरू खोज्नुहोस्…",
  searchEmpty: "कुनै पृष्ठ भेटिएन।",
  language: "भाषा",
  calendar: "पात्रो",
  theme: "थिम",
  themeLight: "उज्यालो",
  themeDark: "अँध्यारो",
  themeSystem: "प्रणाली",
  account: "खाता",
  logout: "लग आउट",
  openMenu: "मेनु खोल्नुहोस्",
  closeMenu: "मेनु बन्द गर्नुहोस्",
  collapseSidebar: "साइडबार सङ्कुचित गर्नुहोस्",
  expandSidebar: "साइडबार विस्तार गर्नुहोस्",
  breadcrumbHome: "होम",
};

export type ShellStrings = typeof en;

export function useStrings(): ShellStrings {
  const { language } = usePrefs();
  return language === "ne" ? ne : en;
}
