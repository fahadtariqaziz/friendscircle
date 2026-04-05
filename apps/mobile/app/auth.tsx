import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { theme } from "@friendscircle/ui";
import { useState } from "react";
import { signIn, signUp, signInWithGoogle } from "@friendscircle/supabase";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }

    if (isSignUp && password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else if (isSignUp) {
      Alert.alert("Success", "Account created! Please check your email to verify.");
    }
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.dark.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.primary.DEFAULT,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 40 }}>👥</Text>
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: theme.colors.primary.DEFAULT,
            marginBottom: 4,
          }}
        >
          FriendsCircle
        </Text>
        <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 14 }}>
          Your Campus. Your Community. One App.
        </Text>
      </View>

      {/* Auth Card */}
      <View
        style={{
          backgroundColor: theme.colors.dark.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 0.5,
          borderColor: theme.colors.dark.border,
        }}
      >
        {/* Google */}
        <Pressable
          onPress={handleGoogle}
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#333", fontWeight: "600", fontSize: 15 }}>
            Continue with Google
          </Text>
        </Pressable>

        {/* Divider */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{ flex: 1, height: 1, backgroundColor: theme.colors.dark.border }}
          />
          <Text
            style={{
              color: theme.colors.dark.textMuted,
              paddingHorizontal: 12,
              fontSize: 12,
            }}
          >
            or
          </Text>
          <View
            style={{ flex: 1, height: 1, backgroundColor: theme.colors.dark.border }}
          />
        </View>

        {/* Form */}
        <TextInput
          placeholder="Email"
          placeholderTextColor={theme.colors.dark.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: theme.colors.dark.surfaceLight,
            borderRadius: 12,
            padding: 14,
            color: theme.colors.dark.textPrimary,
            fontSize: 15,
            marginBottom: 10,
            borderWidth: 0.5,
            borderColor: theme.colors.dark.border,
          }}
        />

        <TextInput
          placeholder={isSignUp ? "Password (min 8 characters)" : "Password"}
          placeholderTextColor={theme.colors.dark.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: theme.colors.dark.surfaceLight,
            borderRadius: 12,
            padding: 14,
            color: theme.colors.dark.textPrimary,
            fontSize: 15,
            marginBottom: 16,
            borderWidth: 0.5,
            borderColor: theme.colors.dark.border,
          }}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: theme.colors.primary.DEFAULT,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading && <ActivityIndicator color="white" size="small" />}
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsSignUp(!isSignUp)}
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text style={{ color: theme.colors.dark.textSecondary, fontSize: 13 }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text style={{ color: theme.colors.primary.DEFAULT, fontWeight: "600" }}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
