import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : 'http://localhost:8000';
};
const BASE_URL = getBaseUrl();

export default function Home() {
  const [ping, setPing] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [name, setName] = useState('Lucy');
  const [greeting, setGreeting] = useState<string | null>(null);
  const [greetLoading, setGreetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doPing = async () => {
    setPingLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/ping`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPing(data?.message ?? 'no message');
    } catch (e: any) {
      setPing(null);
      setError(`Ping failed: ${e.message}`);
    } finally {
      setPingLoading(false);
    }
  };

  const doGreet = async () => {
    if (!name.trim())
      return Alert.alert('Name required', 'Please enter your name.');
    setGreetLoading(true);
    setGreeting(null);
    setError(null);
    try {
      const res = await fetch(
        `${BASE_URL}/greet/${encodeURIComponent(name.trim())}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGreeting(data?.greeting ?? 'no greeting');
    } catch (e: any) {
      setError(`Greet failed: ${e.message}`);
    } finally {
      setGreetLoading(false);
    }
  };

  useEffect(() => {
    doPing();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle='dark-content' />
      {/* Full-width header */}
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
          width: '100%',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            style={{ width: 20, height: 20, marginRight: 6 }}
            source={require('../../assets/images/logo.svg')}
          />
          <Text style={{ fontSize: 20, fontWeight: '700' }}>
            Discovering Dimensions
          </Text>
        </View>
        <Text style={{ color: '#666', fontSize: 12 }}>API: {BASE_URL}</Text>
      </View>

      {/* Fullscreen body */}
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{
          flexGrow: 1,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <View style={{ width: '100%', maxWidth: 1000 }}>
          {/* Full width image */}
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop',
            }}
            style={{
              width: '100%',
              height: 400,
            }}
            resizeMode='cover'
          />

          {/* Content area */}
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 26, fontWeight: '700', marginBottom: 8 }}>
              Welcome to Discovering Dimensions
            </Text>
            <Text style={{ color: '#666', marginBottom: 20, fontSize: 16 }}>
              Ping status: {pingLoading ? '…' : (ping ?? 'not yet')}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={doPing}
                disabled={pingLoading}
                style={{
                  backgroundColor: '#0A84FF',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  opacity: pingLoading ? 0.6 : 1,
                }}
              >
                {pingLoading ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}
                  >
                    Ping Backend
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={doGreet}
                disabled={greetLoading}
                style={{
                  backgroundColor: '#34C759',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  opacity: greetLoading ? 0.6 : 1,
                }}
              >
                {greetLoading ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}
                  >
                    Send Greeting
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Input */}
            <Text style={{ marginBottom: 6, fontWeight: '600', fontSize: 16 }}>
              Your name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder='e.g. Ada'
              autoCapitalize='words'
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: '#fafafa',
                marginBottom: 16,
              }}
            />

            {/* Result */}
            {!!greeting && (
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                Result: {greeting}
              </Text>
            )}
            {!!error && (
              <Text style={{ color: '#D00', marginTop: 10 }}>{error}</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
