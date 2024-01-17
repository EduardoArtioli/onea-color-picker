import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import colorKit from '@colorKit';
import usePickerContext from '@context';
import Thumb from '@thumb';
import { clamp, getStyle, isRtl, isWeb, RenderNativeOnly } from '@utils';

import type { RgbSliderProps } from '@types';
import type { LayoutChangeEvent } from 'react-native';
import type { PanGestureHandlerEventPayload } from 'react-native-gesture-handler';

export function BlueSlider({
  thumbShape: localThumbShape,
  thumbSize: localThumbSize,
  thumbColor: localThumbColor,
  boundedThumb: localBoundedThumb,
  renderThumb: localRenderThumb,
  thumbStyle: localThumbStyle,
  thumbInnerStyle: localThumbInnerStyle,
  sliderThickness: localSliderThickness,
  gestures = [],
  style = {},
  vertical = false,
  reverse = false,
}: RgbSliderProps) {
  const {
    hueValue,
    saturationValue,
    brightnessValue,
    onGestureChange,
    onGestureEnd,
    thumbSize: globalThumbSize,
    thumbShape: globalThumbShape,
    thumbColor: globalThumbColor,
    boundedThumb: globalBoundedThumb,
    renderThumb: globalRenderThumb,
    thumbStyle: globalThumbStyle,
    thumbInnerStyle: globalThumbInnerStyle,
    sliderThickness: globalSliderThickness,
  } = usePickerContext();

  const thumbShape = localThumbShape ?? globalThumbShape,
    thumbSize = localThumbSize ?? globalThumbSize,
    thumbColor = localThumbColor ?? globalThumbColor,
    boundedThumb = localBoundedThumb ?? globalBoundedThumb,
    renderThumb = localRenderThumb ?? globalRenderThumb,
    thumbStyle = localThumbStyle ?? globalThumbStyle ?? {},
    thumbInnerStyle = localThumbInnerStyle ?? globalThumbInnerStyle ?? {},
    sliderThickness = localSliderThickness ?? globalSliderThickness;

  const borderRadius = getStyle(style, 'borderRadius') ?? 5,
    getWidth = getStyle(style, 'width'),
    getHeight = getStyle(style, 'height');

  const width = useSharedValue(vertical ? sliderThickness : typeof getWidth === 'number' ? getWidth : 0),
    height = useSharedValue(!vertical ? sliderThickness : typeof getHeight === 'number' ? getHeight : 0);

  const handleScale = useSharedValue(1);

  const handleStyle = useAnimatedStyle(() => {
    const { b } = colorKit.runOnUI().RGB({ h: hueValue.value, s: saturationValue.value, v: brightnessValue.value }).object(false);

    const length = (vertical ? height.value : width.value) - (boundedThumb ? thumbSize : 0),
      percent = (b / 255) * length,
      pos = (reverse ? length - percent : percent) - (boundedThumb ? 0 : thumbSize / 2),
      posY = vertical ? pos : height.value / 2 - thumbSize / 2,
      posX = vertical ? width.value / 2 - thumbSize / 2 : pos;
    return {
      transform: [{ translateY: posY }, { translateX: posX }, { scale: handleScale.value }],
    };
  }, [thumbSize, boundedThumb, vertical, reverse, width, height, hueValue, saturationValue, brightnessValue, handleScale]);

  const onGestureUpdate = ({ x, y }: PanGestureHandlerEventPayload) => {
    'worklet';

    const { r, g, b } = colorKit
      .runOnUI()
      .RGB({ h: hueValue.value, s: saturationValue.value, v: brightnessValue.value })
      .object(false);

    const length = (vertical ? height.value : width.value) - (boundedThumb ? thumbSize : 0),
      pos = clamp((vertical ? y : x) - (boundedThumb ? thumbSize / 2 : 0), length),
      value = Math.round((pos / length) * 255),
      newBlueValue = reverse ? 255 - value : value;

    if (newBlueValue === b) return;

    const { h, s, v } = colorKit.runOnUI().HSV({ r, g, b: newBlueValue }).object(false);

    hueValue.value = h;
    saturationValue.value = s;
    brightnessValue.value = v;

    onGestureChange();
  };
  const onGestureBegin = (event: PanGestureHandlerEventPayload) => {
    'worklet';
    handleScale.value = withTiming(1.2, { duration: 100 });
    onGestureUpdate(event);
  };
  const onGestureFinish = () => {
    'worklet';
    handleScale.value = withTiming(1, { duration: 100 });
    onGestureEnd();
  };

  const pan = Gesture.Pan().onBegin(onGestureBegin).onUpdate(onGestureUpdate).onEnd(onGestureFinish);
  const tap = Gesture.Tap().onTouchesUp(onGestureFinish);
  const longPress = Gesture.LongPress().onTouchesUp(onGestureFinish);
  const composed = Gesture.Simultaneous(Gesture.Exclusive(pan, tap, longPress), ...gestures);

  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (!vertical) width.value = withTiming(layout.width, { duration: 5 });
    if (vertical) height.value = withTiming(layout.height, { duration: 5 });
  };

  const redGreen = useAnimatedStyle(() => {
    const { r, g } = colorKit.runOnUI().RGB({ h: hueValue.value, s: saturationValue.value, v: brightnessValue.value }).object();

    if (isWeb) {
      const deg = vertical ? (reverse ? 180 : 0) : reverse ? 90 : 270;
      return { background: `linear-gradient(${deg}deg, rgb(${r}, ${g}, 255) 0%, rgb(${r}, ${g}, 0) 100%)` };
    }
    return { backgroundColor: `rgb(${r}, ${g}, 0)` };
  }, [vertical, reverse, hueValue, saturationValue, brightnessValue]);

  const imageStyle = useAnimatedStyle(() => {
    if (isWeb) return {};

    const imageRotate = vertical ? (reverse ? '90deg' : '270deg') : reverse ? '0deg' : '180deg';
    const imageTranslateY = ((height.value - width.value) / 2) * ((reverse && isRtl) || (!reverse && !isRtl) ? -1 : 1);
    const { r, g } = colorKit.runOnUI().RGB({ h: hueValue.value, s: saturationValue.value, v: brightnessValue.value }).object();

    return {
      tintColor: `rgb(${r}, ${g}, 255)`,
      width: vertical ? height.value : '100%',
      height: vertical ? width.value : '100%',
      borderRadius,
      transform: [
        { rotate: imageRotate },
        { translateX: vertical ? ((height.value - width.value) / 2) * (reverse ? 1 : -1) : 0 },
        { translateY: vertical ? imageTranslateY : 0 },
      ],
    };
  }, [vertical, reverse, borderRadius, width, height, hueValue, saturationValue, brightnessValue]);

  const thicknessStyle = vertical ? { width: sliderThickness } : { height: sliderThickness };

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        onLayout={onLayout}
        style={[{ borderRadius }, style, { position: 'relative', borderWidth: 0, padding: 0 }, thicknessStyle, redGreen]}
      >
        <RenderNativeOnly>
          <Animated.Image source={require('@assets/blackGradient.png')} style={imageStyle} />
        </RenderNativeOnly>
        <Thumb
          thumbShape={thumbShape}
          thumbSize={thumbSize}
          thumbColor={thumbColor}
          renderThumb={renderThumb}
          innerStyle={thumbInnerStyle}
          handleStyle={handleStyle}
          style={thumbStyle}
          vertical={vertical}
        />
      </Animated.View>
    </GestureDetector>
  );
}
