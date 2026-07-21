<a id="top"></a>

# Mobile Application Research

<!-- Purpose: Explains native and cross-platform apps and compares React with React Native. Contents: two research topics and sources. -->

## Native vs. Cross-Platform Mobile Applications

A native mobile app is made for one specific operating system. For example, an iOS app can be built with Swift, while an Android app can be built with Kotlin or Java. If a company wants the same app on both iOS and Android, it usually needs two separate versions of the code.

A cross-platform app is built from one main codebase that can run on more than one operating system. React Native is an example of a cross-platform framework because it can be used to build both iOS and Android apps with JavaScript.

Some important differences are:

- **Code:** Native apps normally need separate code for iOS and Android. Cross-platform apps can share most of their code.
- **Development time:** Native development can take longer because the same features may need to be built twice. Cross-platform development can be faster because much of the code is reused.
- **Performance:** Native apps usually have the best performance because they work directly with the operating system. Cross-platform apps can still perform very well, but some complex features may need extra native code.
- **Device features:** Native apps have direct access to features such as the camera, GPS, and notifications. Cross-platform frameworks use libraries or built-in APIs to access those features.
- **Design:** Native apps can follow the exact design style of each operating system. Cross-platform apps make it easier to keep the design similar on both platforms, but some platform-specific changes may still be needed.
- **Maintenance:** A native app may require a bug to be fixed in two codebases. In a cross-platform app, one change can often fix the problem on both platforms.

Native development can be a better choice when an app needs the highest possible performance or uses many platform-specific features. Cross-platform development can be a better choice when a smaller team wants to build and maintain an app for both iOS and Android more quickly.

For the Rocket Food Delivery project, cross-platform development makes sense because React Native and Expo allow the customer app to run on both iOS and Android without creating two completely separate projects.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## React Native vs. React

React and React Native are related, but they are used for different types of applications.

React is a JavaScript library that is mainly used to build websites and web applications. It uses HTML-like elements such as `<div>`, `<p>`, and `<button>`, and the pages are displayed in a web browser. CSS is normally used to style the page.

React Native is a framework used to build mobile applications. It uses the same main React ideas, including components, JSX, props, state, and hooks. However, it does not use regular HTML elements. It uses mobile components such as `<View>`, `<Text>`, `<Pressable>`, and `<TextInput>`.

For example, a simple button could be written differently in each one:

```jsx
// React for the web
<button onClick={handlePress}>Order Now</button>
```

```jsx
// React Native for mobile
<Pressable onPress={handlePress}>
  <Text>Order Now</Text>
</Pressable>
```

Another difference is styling. React web applications can use regular CSS files. React Native normally uses JavaScript style objects or `StyleSheet`. The style properties look similar to CSS, but they are not exactly the same.

React applications also use browser features such as the DOM and browser URLs. React Native applications use mobile APIs and navigation tools such as Expo Router or React Navigation. This allows them to use phone features and move between mobile screens.

Knowing React makes React Native easier to learn because the component structure and programming ideas are similar. The main adjustment is learning to use native mobile components and mobile APIs instead of HTML, CSS, and browser APIs.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## Sources

- [React: Describing the UI](https://react.dev/learn/describing-the-ui)
- [React Native: Core Components and Native Components](https://reactnative.dev/docs/intro-react-native-components)
- [React Native: Platform-Specific Code](https://reactnative.dev/docs/platform-specific-code)

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>
