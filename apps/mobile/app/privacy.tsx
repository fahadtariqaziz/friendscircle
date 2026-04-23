import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `Account Info: email address, full name, university, profile photo, and bio that you provide during sign-up.\n\nContent: posts, comments, and interactions you create on the platform.\n\nDevice Info: push notification token (only if you grant permission) to send you alerts.\n\nUsage Data: which features you use, posts you like or comment on — used to improve the experience.\n\nLocation: only at the city/university level (no GPS tracking).`,
  },
  {
    title: "2. How We Use Your Information",
    body: `• Provide and personalise the FriendsCircle experience\n• Send push notifications for comments, likes, and post approvals\n• Moderate content to keep the platform safe\n• Calculate your XP and level\n• Improve our features based on usage patterns`,
  },
  {
    title: "3. Information Sharing",
    body: `We never sell your personal data.\n\nYour profile (name, university, posts) is visible to other signed-in users. Your email is never shown publicly.\n\nWe use trusted service providers to operate the platform:\n• Supabase — database and authentication (hosted on AWS)\n• Cloudinary — image storage and delivery\n• Expo — push notification delivery\n\nWe may disclose data if required by Pakistani law or court order.`,
  },
  {
    title: "4. Data Security",
    body: `Your data is stored in encrypted databases. Passwords are managed by Supabase Auth — we never store them in plain text.\n\nAll data transmission uses SSL/TLS encryption. Images are served through Cloudinary's secure CDN.`,
  },
  {
    title: "5. Your Controls",
    body: `• Edit or delete your profile at any time from the Profile screen\n• Delete your own posts from the My Posts section\n• Disable push notifications in your phone's Settings\n• Request full account deletion by emailing support@friendscircle.app`,
  },
  {
    title: "6. Push Notifications",
    body: `Push notifications are opt-in — we ask for permission on first launch. We only send notifications for relevant events (comment on your post, post approval, likes).\n\nYou can turn off notifications any time in your phone's Settings → FriendsCircle → Notifications.`,
  },
  {
    title: "7. Children's Privacy",
    body: `FriendsCircle is not intended for users under 16 years of age. If we become aware that a user is under 16, we will delete their account promptly.`,
  },
  {
    title: "8. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. For significant changes, we will notify you via an in-app notification at least 7 days before the change takes effect.`,
  },
  {
    title: "9. Contact",
    body: `For privacy-related questions or data deletion requests:\n\nsupport@friendscircle.app\nIslamabad, Pakistan`,
  },
];

export default function PrivacyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🔒</Text>
          <Text style={styles.heroTitle}>Privacy Policy</Text>
          <Text style={styles.heroSub}>Last updated: June 2026</Text>
          <View style={styles.heroDivider} />
        </View>

        <Text style={styles.intro}>
          Your privacy matters to us. This policy explains what data we collect, how we use it, and the controls you have over your information.
        </Text>

        {/* Never sell callout */}
        <View style={styles.callout}>
          <LinearGradient
            colors={["#55EFC415", "#00CEC910"]}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={{ fontSize: 20, marginBottom: 6 }}>🛡️</Text>
          <Text style={styles.calloutText}>
            We will <Text style={{ color: "#55EFC4", fontWeight: "700" }}>never</Text> sell your personal data to advertisers or third parties.
          </Text>
        </View>

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
            By using FriendsCircle, you consent to data practices described in this Privacy Policy.
          </Text>
          <Pressable onPress={() => router.push("/terms")}>
            <Text style={styles.footerLink}>View Terms of Service →</Text>
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
    backgroundColor: "#00CEC9",
  },
  intro: {
    color: "#8888AA",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: "center",
  },
  callout: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#55EFC425",
    alignItems: "center",
  },
  calloutText: {
    color: "#8888AA",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
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
    backgroundColor: "#00CEC9",
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
    color: "#00CEC9",
    fontSize: 13,
    fontWeight: "600",
  },
});
