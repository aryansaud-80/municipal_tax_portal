"use client";

import { usePrefs } from "./display-prefs";

const en = {
  appName: "Municipal Tax",
  portalName: "Citizen Portal",
  navDashboard: "Dashboard",
  navProperties: "My Properties",
  navTaxes: "Taxes & Dues",
  navPayments: "Payments",
  navReceipts: "Receipts",
  navNotifications: "Notifications",
  navProfile: "Profile",
  tabHome: "Home",
  tabBills: "Bills",
  tabPay: "Pay",
  tabProfile: "Profile",
  search: "Search",
  searchPlaceholder: "Search pages…",
  searchEmpty: "No matching pages.",
  language: "Language",
  calendar: "Calendar",
  theme: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "System",
  notifications: "Notifications",
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
  portalName: "नागरिक पोर्टल",
  navDashboard: "ड्यासबोर्ड",
  navProperties: "मेरा सम्पत्तिहरू",
  navTaxes: "कर तथा बक्यौता",
  navPayments: "भुक्तानीहरू",
  navReceipts: "रसिदहरू",
  navNotifications: "सूचनाहरू",
  navProfile: "प्रोफाइल",
  tabHome: "होम",
  tabBills: "बिलहरू",
  tabPay: "तिर्नुहोस्",
  tabProfile: "प्रोफाइल",
  search: "खोज्नुहोस्",
  searchPlaceholder: "पृष्ठहरू खोज्नुहोस्…",
  searchEmpty: "कुनै पृष्ठ भेटिएन।",
  language: "भाषा",
  calendar: "पात्रो",
  theme: "थिम",
  themeLight: "उज्यालो",
  themeDark: "अँध्यारो",
  themeSystem: "प्रणाली",
  notifications: "सूचनाहरू",
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
