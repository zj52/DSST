# DSST Application Specification

## Overview

The Digit Symbol Substitution Test (DSST) is a neuropsychological assessment tool used to measure cognitive processing speed, attention, and visual-motor coordination. This document outlines the specifications for a web-based implementation of the DSST.

## User Roles

1. **Test Takers (Users)**
   - Take the DSST assessment
   - View their own results upon completion

2. **Administrators**
   - View all test results
   - Configure system settings
   - Export data for analysis

## Functional Requirements

### Authentication

- Simple username/password authentication
- Different access levels for users and administrators
- Session persistence for the duration of use

### User Interface

1. **Home Page**
   - Welcome screen with login option
   - Clean, distraction-free design

2. **Test Interface**
   - Symbol key display showing digit-symbol pairings
   - Input area for entering digit responses
   - Timer displaying remaining time
   - Counter showing completed items
   - Navigation help for keyboard shortcuts

3. **Admin Dashboard**
   - Results table with filtering options
   - Configuration settings
   - Data export functionality
   - Summary statistics

### Assessment Mechanics

1. **Test Format**
   - Symbol-to-digit matching paradigm
   - 90-second time limit
   - Unlimited potential items (continuous generation)
   - Keyboard navigation between input fields
   - Immediate validation of inputs

2. **Scoring**
   - Count of correct matches
   - Time spent on assessment
   - Calculation of accuracy percentage

### Admin Features

1. **Results Management**
   - View all test results in tabular format
   - Filter results by date
   - Export results to CSV format

2. **Configuration**
   - Set redirect URL for post-assessment questionnaire
   - Configure daily cutoff time for test availability
   - Timezone handling for cutoff time

### Data Flow

1. **Test Taking Process**
   - User logs in
   - Views instructions
   - Completes assessment
   - Sees completion message
   - Redirects to follow-up questionnaire

2. **Data Storage**
   - User credentials stored securely
   - Test results saved with timestamp
   - Configuration settings persisted

## Technical Requirements

### Frontend

- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling
- React Router for navigation
- Local storage for data persistence

### Deployment

- Deployable to GitHub Pages or similar static hosting
- Responsive design for various screen sizes
- Support for modern browsers

## Security Considerations

- Secure authentication practices
- Data validation on all inputs
- Protection against common web vulnerabilities
- No transmission of sensitive personal data

## Future Enhancements

- Integration with backend API for persistent data storage
- Additional cognitive assessments
- Enhanced analytics and visualizations
- User profile management
- Multi-language support 