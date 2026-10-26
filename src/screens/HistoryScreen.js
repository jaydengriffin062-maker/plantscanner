import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../components/EmptyState';
import HistoryItem from '../components/HistoryItem';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing } from '../constants/theme';
import { clearHistory, getHistory, removeFromHistory } from '../services/historyStorage';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getHistory().then((items) => {
        if (!active) return;
        setHistory(items);
        setLoaded(true);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const confirmClearAll = useCallback(() => {
    Alert.alert('Clear history?', 'This removes all saved scans and their photos.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => setHistory(await clearHistory()),
      },
    ]);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        history.length > 0 ? (
          <Pressable onPress={confirmClearAll} hitSlop={8}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, history.length, confirmClearAll]);

  const confirmDelete = (record) => {
    Alert.alert('Delete scan?', `Remove ${record.matches[0].commonName} from your history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => setHistory(await removeFromHistory(record.id)),
      },
    ]);
  };

  if (loaded && history.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="leaf-outline"
          title="No scans yet"
          message="Plants you identify are saved here so you can look them up again, even offline."
        >
          <PrimaryButton
            title="Scan a plant"
            icon="camera-outline"
            onPress={() => navigation.navigate('Camera')}
            style={styles.button}
          />
        </EmptyState>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HistoryItem
          record={item}
          onPress={() => navigation.navigate('Results', { record: item })}
          onDelete={() => confirmDelete(item)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
  clear: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
  },
  button: {
    alignSelf: 'stretch',
  },
});
