import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const apiBase =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'https://deine-server-url';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>timetime</Text>
      <Text style={styles.subtitle}>Mobile-App (Expo)</Text>
      <Text style={styles.hint}>
        API-Basis: {apiBase}
        {'\n'}
        Setze EXPO_PUBLIC_API_URL auf die URL deiner Next.js-Instanz.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
});
