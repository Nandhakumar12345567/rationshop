import { registerRootComponent } from 'expo';
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
      background-color: #061E47;
      color: #F8FAFC;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `;
  document.head.appendChild(style);
}

registerRootComponent(App);

export default App;
