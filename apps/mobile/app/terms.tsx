import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By downloading, installing, or using FriendsCircle, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.\n\nYou must be at least 16 years old to use FriendsCircle. By using the app, you confirm that you meet this requirement.`,
  },
  {
    title: "2. Description of Service",
    body: `FriendsCircle is a social platform for university students in Pakistan. It allows users to:\n\n• Post and discover content (OLX, Books, Ride Share, Roommate, Teacher Reviews, Past Papers, Events, Lost & Found, Freelance Assignments, and more)\n• Connect with classmates through Friend Circles\n• Earn XP and level up through participation\n\nFeatures and availability may change over time.`,
  },
  {
    title: "3. User Accounts",
    body: `You are responsible for maintaining the confidentiality of your account credentials. Provide accurate information when signing up. One account per person — creating multiple accounts is prohibited.\n\nWe reserve the right to suspend or delete accounts that violate these terms.`,
  },
  {
    title: "4. User Content",
    body: `You own the content you post. By posting, you grant FriendsCircle a non-exclusive licence to display your content on the platform.\n\nAll posts go through a moderation process before being visible to others. Posts are automatically removed after 30 days to keep the platform fresh.\n\nYou must not post content that is illegal, harmful, misleading, or violates anyone's rights.`,
  },
  {
    title: "5. Prohibited Conduct",
    body: `You agree not to:\n\n• Harass, threaten, or abuse other users\n• Post fake, spam, or misleading content\n• Share others' private information without consent\n• Impersonate other people or institutions\n• Use the platform for commercial advertising without permission\n• Violate PECA 2016 or any applicable Pakistani law`,
  },
  {
    title: "6. Disclaimers",
    body: `FriendsCircle is provided "as-is". We do not guarantee the accuracy of user-posted content (e.g. teacher reviews, job listings, prices). Transactions between users (e.g. OLX, Books) are solely between those parties — we are not liable for any disputes.\n\nWe may modify or discontinue the service at any time.`,
  },
  {
    title: "7. Governing Law",
    body: `These terms are governed by the laws of Pakistan. Any disputes will be subject to the jurisdiction of courts in Islamabad, Pakistan.`,
  },
  {
    title: "8. Contact",
    body: `For any questions about these Terms, contact us at:\n\nsupport@friendscircle.app`,
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F1A" }}>
      {/* Header */}
      <LinearGradient
        colors={["#1A1235", "#0F0F1A"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📋</Text>
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Text style={styles.heroSub}>Last updated: June 2026</Text>
          <View style={styles.heroDivider} />
        </View>

        <Text style={styles.intro}>
          Welcome to FriendsCircle — Pakistan's university social platform. Please read these terms carefully before using the app.
        </Text>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <LinearGradient
              colors={["#1E1E3A", "#16162A"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using FriendsCircle, you acknowledge that you have read and agree to these Terms of Service.
          </Text>
          <Pressable onPress={() => router.push("/privacy")}>
            <Text style={styles.footerLink}>View Privacy Policy →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff08",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff10",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  hero: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 40, marginBottom: 12 },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroSub: { color: "#555577", fontSize: 13 },
  heroDivider: {
    marginTop: 16,
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#6C5CE7",
  },
  intro: {
    color: "#8888AA",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff08",
  },
  sectionAccent: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
    backgroundColor: "#6C5CE7",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    paddingLeft: 12,
  },
  sectionBody: {
    color: "#8888AA",
    fontSize: 13,
    lineHeight: 21,
    paddingLeft: 12,
  },
  footer: {
    marginTop: 12,
    alignItems: "center",
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#ffffff08",
  },
  footerText: {
    color: "#444466",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },
  footerLink: {
    color: "#6C5CE7",
    fontSize: 13,
    fontWeight: "600",
  },
});
