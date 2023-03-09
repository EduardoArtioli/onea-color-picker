import { StyleSheet, I18nManager } from 'react-native';

const isRtl = I18nManager.isRTL;

const styles = StyleSheet.create({
  container: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButton: {
    width: 24,
    height: 24,
    marginHorizontal: 10,
  },
  inputsWrapper: {
    flex: 1,
    flexDirection: isRtl ? 'row-reverse' : 'row',
    gap: 5,
  },
  inputsContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 5,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  inputTitle: {
    textAlign: 'center',
    paddingVertical: 5,
  },
});

export default styles;
