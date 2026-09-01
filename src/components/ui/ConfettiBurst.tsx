import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';

const PARTICLE_COUNT = 32;
const COLORS = [
  '#4EBA86',
  '#F59E0B',
  '#38BDF8',
  '#EC4899',
  '#8B5CF6',
  '#10B981',
  '#EF4444',
  '#FCD34D',
];

type Particle = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
};

export function ConfettiBurst({ onComplete }: { onComplete?: () => void }) {
  const { width, height } = Dimensions.get('window');
  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height * 0.45),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: COLORS[i % COLORS.length],
      size: Math.random() * 8 + 6,
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((p) => {
      const angle = Math.random() * 2 * Math.PI;
      const velocity = Math.random() * 180 + 80;
      const targetX = width / 2 + Math.cos(angle) * velocity;
      const targetY = height * 0.45 + Math.sin(angle) * velocity + 100;

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: targetX,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: targetY,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.scale, {
            toValue: 1.2,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(p.scale, {
            toValue: 0.7,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  }, [particles, width, height, onComplete]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.size > 10 ? p.size / 2 : 2,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
