import { scaledPixels } from '@/hooks/useScale';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { View, StyleSheet, Image, Platform, Text } from 'react-native';
import { DefaultFocus, SpatialNavigationFocusableView, SpatialNavigationRoot } from 'react-tv-space-navigation';
import { useRouter } from 'expo-router';
import { useMenuContext } from '@/components/MenuContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define props interface
interface DrawerContentProps {
  [key: string]: any;
}

// Define drawer item interface and use specific route types
interface DrawerItem {
  name: '/' | '/(drawer)/' | '/(drawer)/explore' | '/(drawer)/tv'; // Use the specific route types
  label: string;
}

export default function CustomDrawerContent(props: DrawerContentProps) {
  const router = useRouter();
  const { isOpen: isMenuOpen, toggleMenu } = useMenuContext();
  const styles = useDrawerStyles();
  const insets = useSafeAreaInsets();

  // Define drawer navigation items with correct route types
  const drawerItems: DrawerItem[] = [
    { name: '/', label: 'Home' },
    { name: '/(drawer)/explore', label: 'Series' }, // Updated to use proper route format
    { name: '/(drawer)/tv', label: 'Live Stream' }, // Updated to use proper route format
  ];

  // Navigate to specified route
  const navigateTo = (routeName: '/' | '/(drawer)/' | '/(drawer)/explore' | '/(drawer)/tv') => {
    toggleMenu(false);
    router.push({
      pathname: routeName,
    });
  };

  return (
    <SpatialNavigationRoot isActive={isMenuOpen}>
      <DrawerContentScrollView
        {...props}
        style={styles.container}
        scrollEnabled={false}
        contentContainerStyle={{
          ...(Platform.OS === 'ios' && Platform.isTV && { paddingStart: 0, paddingEnd: 0, paddingTop: 0 }),
        }}
      >
        <View style={styles.header}>
          <Image
            source={{
              uri: 'https://images.squarespace-cdn.com/content/v1/5000d51de4b0392912a47ef2/1605108881444-GSZYHESIKEAT6TLX8TS2/ke17ZwdGBToddI8pDm48kNvT88LknE-K9M4pGNO0Iqd7gQa3H78H3Y0txjaiv_0fDoOvxcdMmMKkDsyUqMSsMWxHk725yiiHCCLfrh8O1z5QPOohDIaIeljMHgDF5CVlOqpeNLcJ80NK65_fV7S1UbeDbaZv1s3QfpIA4TYnL5Qao8BosUKjCVjCf8TKewJIH3bqxw7fF48mhrq5Ulr0Hg/cbclive.png',
            }}
            style={styles.churchLogo}
          />
          <Text style={styles.churchName}>Calvary Baptist Church</Text>
          <Text style={styles.churchTagline}>Worship with us online</Text>
        </View>

        {drawerItems.map((item, index) =>
          index === 0 ? (
            <DefaultFocus key={index}>
              <SpatialNavigationFocusableView
                onSelect={() => {
                  console.log(item.name);
                  navigateTo(item.name);
                }}
              >
                {({ isFocused }) => (
                  <View style={[styles.menuItem, isFocused && styles.menuItemFocused]}>
                    <Text style={[styles.menuText, isFocused && styles.menuTextFocused]}>{item.label}</Text>
                  </View>
                )}
              </SpatialNavigationFocusableView>
            </DefaultFocus>
          ) : (
            <SpatialNavigationFocusableView
              key={index}
              onSelect={() => {
                console.log(item.name);
                navigateTo(item.name);
              }}
            >
              {({ isFocused }) => (
                <View style={[styles.menuItem, isFocused && styles.menuItemFocused]}>
                  <Text style={[styles.menuText, isFocused && styles.menuTextFocused]}>{item.label}</Text>
                </View>
              )}
            </SpatialNavigationFocusableView>
          ),
        )}

        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About Us</Text>
          <Text style={styles.aboutText}>
            Calvary Baptist Church is dedicated to spreading the love of Christ through worship, fellowship, and
            service.
          </Text>
          <Text style={styles.contactInfo}>Sunday Worship: 10:00 AM EST</Text>
        </View>
      </DrawerContentScrollView>
    </SpatialNavigationRoot>
  );
}

const useDrawerStyles = function () {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      paddingTop: scaledPixels(20),
    },
    header: {
      padding: scaledPixels(16),
      alignItems: 'center',
      marginBottom: scaledPixels(20),
    },
    churchLogo: {
      width: scaledPixels(200),
      height: scaledPixels(200),
      resizeMode: 'contain',
      marginBottom: scaledPixels(20),
    },
    churchName: {
      color: 'white',
      fontSize: scaledPixels(36),
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: scaledPixels(16),
    },
    churchTagline: {
      color: '#cccccc',
      fontSize: scaledPixels(20),
      textAlign: 'center',
      marginTop: scaledPixels(8),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: scaledPixels(16),
      paddingHorizontal: scaledPixels(32),
      marginVertical: scaledPixels(4),
    },
    menuItemFocused: {
      backgroundColor: '#3d85c6', // Blue color that works well with church themes
      borderRadius: scaledPixels(5),
    },
    menuText: {
      color: 'white',
      fontSize: scaledPixels(28),
      fontWeight: '500',
    },
    menuTextFocused: {
      color: 'white',
      fontWeight: 'bold',
    },
    aboutSection: {
      marginTop: scaledPixels(60),
      padding: scaledPixels(32),
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    aboutTitle: {
      color: 'white',
      fontSize: scaledPixels(24),
      fontWeight: 'bold',
      marginBottom: scaledPixels(12),
    },
    aboutText: {
      color: '#cccccc',
      fontSize: scaledPixels(18),
      lineHeight: scaledPixels(28),
      marginBottom: scaledPixels(16),
    },
    contactInfo: {
      color: '#ffffff',
      fontSize: scaledPixels(18),
      marginTop: scaledPixels(8),
    },
  });
};
