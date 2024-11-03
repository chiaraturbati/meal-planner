# Meal Planner 🍽️

A React-based meal planning application that helps users organize and share their weekly meal plans.

## Features ✨

- 📅 Weekly meal planning interface
- 🔄 Easy meal management (add, edit, delete)
- 👥 Share meal plans with other users
- 📋 Copy meals between different dates
- 🎨 Categorized meals for better organization
- 🔒 Secure authentication and data protection

## Technologies Used 🛠️

- React 18
- Firebase (Authentication & Firestore)
- Modern JavaScript (ES6+)

## Prerequisites 📋

Before you begin, ensure you have:

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Firebase project with Firestore enabled

## Installation 🚀

1. Clone the repository:

```bash
git clone https://github.com/yourusername/meal-planner.git
cd meal-planner
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:

```bash
npm start
```

## Firebase Setup 🔥

1. Create a new Firebase project
2. Enable Email/Password authentication
3. Create a Firestore database
4. Add these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isSharedWith(email) {
      return request.auth != null &&
             email == request.auth.token.email &&
             resource.data.sharedWith[email] == true;
    }

    match /mealPlans/{planId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        resource.data.sharedWith[request.auth.token.email] == true
      );

      allow create: if isAuthenticated() &&
                   request.resource.data.userId == request.auth.uid;

      allow update: if isAuthenticated() &&
                   resource.data.userId == request.auth.uid;

      allow delete: if isAuthenticated() &&
                   resource.data.userId == request.auth.uid;
    }

    match /meals/{mealId} {
      function getPlan(planId) {
        return get(/databases/$(database)/documents/mealPlans/$(planId));
      }

      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        getPlan(resource.data.planId).data.sharedWith[request.auth.token.email] == true
      );

      allow write: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Project Structure 📁

```
src/
  components/           # React components
    WeeklyView.js      # Weekly calendar view
    MealForm.js        # Add/edit meal form
    SharingManager.js  # Sharing management
    SharedMealsView.js # Shared meals display
  utils/               # Utility functions
    migrateMealPlans.js
    fixDatabase.js
    sharedMealsLoader.js
    styles.js
    debugUtils.js
  App.js               # Main application component
  firebase.js         # Firebase configuration
```

## Available Scripts 📜

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from create-react-app

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments 🙏

- [Create React App](https://github.com/facebook/create-react-app)
- [Firebase](https://firebase.google.com/)

## Contact 📧

Chiara Turbati

Project Link: [https://github.com/yourusername/meal-planner](https://github.com/yourusername/meal-planner)
