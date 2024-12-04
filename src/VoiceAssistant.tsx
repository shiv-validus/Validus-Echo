import React, { useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Voice from 'react-native-voice';
import Tts from 'react-native-tts';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Fuse from 'fuse.js';

// Predefined static responses
const staticResponses = {
  hello: 'Hi there! How can I assist you?',
  'how are you': "I'm just a voice assistant, but I'm doing great! How can I help you today?",
  'what is your name': "I'm Validus Echo, your virtual assistant.",
  'tell me a joke': "Why don't scientists trust atoms? Because they make up everything!",
};

// Convert responses into an array for Fuse.js
const responseList = Object.keys(staticResponses).map((key) => ({
  query: key,
  response: staticResponses[key],
}));

const fuse = new Fuse(responseList, {
  keys: ['query'],
  threshold: 0.3,
  distance: 50,
});

const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Set up voice listeners
    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechError = handleSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      Tts.stop(); // Stop TTS when component unmounts
    };
  }, []);

  const startListening = async (): Promise<void> => {
    if (isListening || isSpeaking) return;
    setIsListening(true);
    resetState();
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting Voice recognition:', error);
    }
  };

  const stopListening = async (): Promise<void> => {
    if (!isListening) return;
    setIsListening(false);
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping Voice recognition:', error);
    }
  };

  const resetState = (): void => {
    setUserQuery('');
    setResponse('');
  };

  const preprocessInput = (input: string): string => {
    // Clean and trim input
    return input.toLowerCase().trim().replace(/[^a-z0-9\s]/gi, '').slice(0, 100);
  };

  const handleSpeechResults = (event: any): void => {
    const spokenText = event.value?.[0]?.toLowerCase() || '';
    console.log('Raw User Query:', spokenText);

    const cleanedQuery = preprocessInput(spokenText);
    console.log('Cleaned Query:', cleanedQuery);

    setUserQuery(cleanedQuery);
    processQuery(cleanedQuery);
  };

  const handleSpeechError = (error: any): void => {
    console.error('Speech recognition error:', error);

    respondToUser("Sorry, I couldn't understand that.");
    stopListening();
  };

  const processQuery = (query: string): void => {
    if (!query) {
      respondToUser("I didn't hear anything. Can you repeat that?");
      return;
    }

    const result = fuse.search(query); // Search for the best match
    console.log('Fuzzy Match Result:', result);

    let reply = "Sorry, I didn't catch that.";
    if (result.length > 0) {
      reply = result[0].item.response;
    }

    respondToUser(reply);
  };

  const respondToUser = async (reply: string): Promise<void> => {
    if (isSpeaking) return; // Prevent repeated responses
    setIsSpeaking(true);
    setResponse(reply);

    try {
      // Stop ongoing TTS before starting new speech
      await Tts.stop();

      // Start speaking the reply
      Tts.speak(reply, {
        onDone: () => {
          setIsSpeaking(false); // Reset state after speaking is complete
        },
        onCancel: () => {
          setIsSpeaking(false); // Reset state if speech is canceled
        },
      });
    } catch (error) {
      console.error('Error in TTS:', error);
      setIsSpeaking(false); // Ensure state is reset on error
    }
  };

  return (
    <LinearGradient colors={['#4A00E0', '#8E2DE2']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Validus Echo</Text>

        {isListening && (
          <Animatable.View animation="fadeIn" style={styles.listeningIndicatorContainer}>
            <Animatable.View animation="pulse" iterationCount="infinite" duration={1000} style={styles.listeningWave} />
          </Animatable.View>
        )}

        {!isListening ? (
          <TouchableOpacity style={styles.gradientButton} activeOpacity={0.8} onPress={startListening}>
            <LinearGradient colors={['#FF512F', '#F09819']} style={styles.buttonContent}>
              <Icon name="mic" size={24} color="#fff" />
              <Text style={styles.buttonText}>Activate "Validus"</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.gradientButton} activeOpacity={0.8} onPress={stopListening}>
            <LinearGradient colors={['#F09819', '#FF512F']} style={styles.buttonContent}>
              <Icon name="mic-off" size={24} color="#fff" />
              <Text style={styles.buttonText}>Stop Listening</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {response && (
          <Animatable.View animation="fadeInUp" delay={200} style={styles.card}>
            <Text style={styles.cardTitle}>Response:</Text>
            <Text style={styles.cardText}>{response}</Text>
          </Animatable.View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 40, textAlign: 'center' },
  gradientButton: { borderRadius: 50, marginVertical: 10, paddingVertical: 5, height: 100 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 1, width: 200, borderRadius: 50 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  listeningIndicatorContainer: { marginVertical: 10, justifyContent: 'center', alignItems: 'center' },
  listeningWave: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 255, 255, 0.4)', position: 'absolute' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 20, padding: 20, marginVertical: 10, width: '90%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  cardText: { fontSize: 16, color: '#fff', textAlign: 'center' },
});

export default VoiceAssistant;
