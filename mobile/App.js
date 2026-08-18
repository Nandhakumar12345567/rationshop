import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { colors } from './src/theme/colors';
import Header from './src/components/Header';
import SplashScreen from './src/components/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import CustomerView from './src/screens/customer/CustomerView';
import ShopkeeperView from './src/screens/shopkeeper/ShopkeeperView';
import AdminView from './src/screens/admin/AdminView';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en'); // 'en' or 'ta'
  const [role, setRole] = useState('CUSTOMER'); // 'CUSTOMER', 'SHOPKEEPER', 'ADMIN'
  const [profileImage, setProfileImage] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.category === 'STAFF') {
      setRole('SHOPKEEPER');
    } else if (userData.category === 'ADMIN') {
      setRole('ADMIN');
    } else {
      setRole('CUSTOMER');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" />

      <Header
        lang={lang}
        setLang={setLang}
        currentRole={role}
        setRole={setRole}
        user={user}
        onLogout={handleLogout}
        profileImage={profileImage}
        onImageSelected={setProfileImage}
      />

      <View style={styles.body}>
        {!user ? (
          <LoginScreen lang={lang} onLoginSuccess={handleLoginSuccess} />
        ) : role === 'CUSTOMER' ? (
          <CustomerView 
            user={user} 
            lang={lang} 
            profileImage={profileImage}
            onImageSelected={setProfileImage}
          />
        ) : role === 'SHOPKEEPER' ? (
          <ShopkeeperView lang={lang} />
        ) : (
          <AdminView lang={lang} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#F4F6F9'
  },
  body: {
    flex: 1
  }
});
