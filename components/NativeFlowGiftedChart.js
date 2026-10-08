import React from 'react';
import { View, Text } from 'react-native';
import ChartLegend from './ChartLegend';
import { buildGiftedPlan, specWithRows } from './chartPlanRuntime';

/**
 * NativeFlowGiftedChart — the single gifted-charts runtime for Expo Go and the
 * generated app.
 *
 * Static data: the plan arrived fully resolved from the exporter.
 * Bound data: the rows only exist now, so the plan is rebuilt here by calling
 * the very same transform functions the exporter called (shipped verbatim in
 * ./chartPlanRuntime), which is what keeps the two paths from drifting.
 */

let Charts = null;
try {
  // Guarded so a project whose install is missing the library shows a note
  // instead of crashing the screen. The exporter separately asserts the
  // dependency is present, so this can only fire on user tampering.
  Charts = require('react-native-gifted-charts');
} catch (e) {
  Charts = null;
}

function chartAccessibilityLabel(plan) {
  const props = plan.props || {};
  const rows = props.stackData || props.data || [];
  const count = Array.isArray(rows) ? rows.length : 0;
  const kind = plan.component === 'PieChart' ? 'pie' : plan.component === 'LineChart' ? 'line' : 'bar';
  const labels = (Array.isArray(rows) ? rows : []).map((r) => r && r.label).filter(Boolean);
  const range = labels.length ? ', categories ' + labels[0] + ' to ' + labels[labels.length - 1] : '';
  return (plan.title ? plan.title + '. ' : '') + kind + ' chart with ' + count + ' data points' + range;
}

export default function NativeFlowGiftedChart({ plan: incoming, spec, colors, rows, style }) {
  const plan = React.useMemo(() => {
    if (!Array.isArray(rows) || !spec) return incoming;
    try {
      return buildGiftedPlan(specWithRows(spec, rows), colors || {});
    } catch (e) {
      return incoming;
    }
  }, [incoming, spec, colors, rows]);

  // Charts with display options carry pre-formatted tooltip text; the label
  // component is a function, so it is attached here rather than in plan.props.
  const chartProps = React.useMemo(() => {
    if (!plan) return null;
    const tooltip = plan.tooltip;
    if (!tooltip || !plan.props || !plan.props.pointerConfig) return plan.props;
    return {
      ...plan.props,
      pointerConfig: {
        ...plan.props.pointerConfig,
        pointerLabelComponent: (_items, _secondary, index) => {
          const i = typeof index === 'number' && index >= 0 ? index : tooltip.values.length - 1;
          return (
            <View style={{ backgroundColor: '#1F1B2E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{tooltip.values[i] || ''}</Text>
              {tooltip.labels[i] ? (
                <Text style={{ color: '#C9C6D6', fontSize: 10, marginTop: 2 }}>{tooltip.labels[i]}</Text>
              ) : null}
            </View>
          );
        },
      },
    };
  }, [plan]);

  if (!plan) return null;

  const wrapperStyle = [
    { width: plan.width, backgroundColor: plan.backgroundColor },
    style,
  ];

  if (!Charts) {
    return (
      <View style={wrapperStyle}>
        <Text style={{ fontSize: 11, color: plan.titleColor }}>
          Chart unavailable: react-native-gifted-charts is not installed.
        </Text>
      </View>
    );
  }

  const Component =
    plan.component === 'PieChart'
      ? Charts.PieChart
      : plan.component === 'LineChart'
      ? Charts.LineChart
      : Charts.BarChart;

  return (
    <View
      style={wrapperStyle}
      accessible
      accessibilityRole="image"
      accessibilityLabel={chartAccessibilityLabel(plan)}
    >
      {plan.title ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: plan.titleColor, marginBottom: 6 }}>
          {plan.title}
        </Text>
      ) : null}
      <Component {...chartProps} />
      {plan.legend ? (
        <ChartLegend items={plan.legend.items} textColor={plan.legend.textColor} />
      ) : null}
    </View>
  );
}
