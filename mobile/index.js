import { AppRegistry } from 'react-native';
import App from './App';

// Inject CSS reset for React Native Web root container
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root, #main {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      background-color: #0B132B;
      color: #F8FAFC;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `;
  document.head.appendChild(style);
}

// Register the root component
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('smart-ration-mobile', () => App);

// Explicitly mount onto web DOM
if (typeof document !== 'undefined') {
  const rootTag = document.getElementById('root') || document.getElementById('main') || document.body;
  AppRegistry.runApplication('main', {
    initialProps: {},
    rootTag
  });
}

export default App;
