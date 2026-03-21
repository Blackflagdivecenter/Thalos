import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { PanResponder } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

interface Point { x: number; y: number }

function pointsToPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y}`;
  }
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ` + rest.map(p => `L ${p.x} ${p.y}`).join(' ');
}

interface SignaturePadProps {
  height?: number;
  onSign: (svgData: string) => void;
  existingData?: string | null;
  label?: string;
}

export function SignaturePad({ height = 150, onSign, existingData, label }: SignaturePadProps) {
  // All drawing state in refs so the static PanResponder sees current values
  const completedPathsRef = useRef<string[]>([]);
  const currentPointsRef  = useRef<Point[]>([]);
  const onSignRef         = useRef(onSign);
  onSignRef.current       = onSign;

  const [, tick] = useState(0);
  const redraw = () => tick(n => n + 1);

  const hasDrawing = completedPathsRef.current.length > 0 || currentPointsRef.current.length > 0;

  // The overlay View is absoluteFill on top of the SVG.
  // locationX/locationY from the PanResponder are always relative to THIS overlay,
  // which perfectly maps to the canvas coordinates — no pageX math needed.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponderCapture:  () => true,
      // Never yield the responder back to a parent (e.g. ScrollView)
      onPanResponderTerminationRequest:    () => false,

      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        currentPointsRef.current = [{ x, y }];
        redraw();
      },

      onPanResponderMove: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        currentPointsRef.current = [...currentPointsRef.current, { x, y }];
        redraw();
      },

      onPanResponderRelease: () => {
        if (currentPointsRef.current.length === 0) return;
        const pathStr = pointsToPath(currentPointsRef.current);
        completedPathsRef.current = [...completedPathsRef.current, pathStr];
        currentPointsRef.current = [];
        onSignRef.current(completedPathsRef.current.join(' '));
        redraw();
      },

      onPanResponderTerminate: () => {
        if (currentPointsRef.current.length > 0) {
          const pathStr = pointsToPath(currentPointsRef.current);
          completedPathsRef.current = [...completedPathsRef.current, pathStr];
          currentPointsRef.current = [];
          onSignRef.current(completedPathsRef.current.join(' '));
          redraw();
        }
      },
    })
  ).current;

  function handleClear() {
    completedPathsRef.current = [];
    currentPointsRef.current  = [];
    onSignRef.current('');
    redraw();
  }

  const currentPath = pointsToPath(currentPointsRef.current);

  return (
    <View style={sp.wrapper}>
      {label ? <Text style={sp.label}>{label}</Text> : null}
      <View style={[sp.canvas, { height }]}>
        {/* SVG is purely for rendering — pointerEvents none so it never intercepts touches */}
        <Svg
          width="100%"
          height={height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Line
            x1="16" y1={height - 30}
            x2="96%" y2={height - 30}
            stroke={Colors.border}
            strokeWidth={1}
          />
          {completedPathsRef.current.map((d, i) => (
            <Path key={i} d={d} stroke="#1C1C1E" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {currentPath ? (
            <Path d={currentPath} stroke="#1C1C1E" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </Svg>

        {/* Transparent overlay owns ALL touch events */}
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />

        {!hasDrawing && (
          <View style={sp.placeholder} pointerEvents="none">
            <Text style={sp.placeholderText}>Sign here</Text>
          </View>
        )}
        {hasDrawing && (
          <Pressable style={sp.clearBtn} onPress={handleClear} hitSlop={12}>
            <Text style={sp.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface SavedSignatureViewProps {
  svgData: string;
  height?: number;
  label?: string;
  onResign: () => void;
  containerWidth?: number;
}

export function SavedSignatureView({ svgData, height = 150, label, onResign, containerWidth }: SavedSignatureViewProps) {
  return (
    <View style={sp.wrapper}>
      {label ? <Text style={sp.label}>{label}</Text> : null}
      <View style={[sp.canvas, { height }]}>
        <Svg width={containerWidth ?? '100%'} height={height} style={StyleSheet.absoluteFill}>
          {svgData.split(' M ').filter(Boolean).map((segment, i) => (
            <Path
              key={i}
              d={i === 0 ? segment : `M ${segment}`}
              stroke="#1C1C1E"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
        <Pressable style={sp.resignBtn} onPress={onResign} hitSlop={12}>
          <Text style={sp.resignText}>Re-sign</Text>
        </Pressable>
      </View>
    </View>
  );
}

const sp = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  canvas: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white ?? '#FFFFFF',
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  placeholderText: {
    ...(Typography.body as TextStyle),
    color: Colors.textTertiary,
  },
  clearBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.sm,
    padding: Spacing.xs,
    zIndex: 10,
  },
  clearText: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.accentBlue,
    fontWeight: '600',
  },
  resignBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.sm,
    padding: Spacing.xs,
  },
  resignText: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.accentBlue,
    fontWeight: '600',
  },
});
