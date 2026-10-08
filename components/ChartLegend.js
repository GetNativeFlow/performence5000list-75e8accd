import React from 'react';
import { View, Text } from 'react-native';

/**
 * ChartLegend — NativeFlow's legend for gifted-charts, which ships none.
 * Multi-series mobile charts are unreadable without it.
 */
export default function ChartLegend({ items, textColor }) {
  if (!items || items.length === 0) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 8,
      }}
    >
      {items.map((item, index) => (
        <View
          key={String(item.label) + index}
          style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginTop: 4 }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              marginRight: 6,
              backgroundColor: item.color || '#999999',
            }}
          />
          <Text style={{ fontSize: 11, color: textColor || '#14181B' }} numberOfLines={1}>
            {String(item.label)}
          </Text>
        </View>
      ))}
    </View>
  );
}
