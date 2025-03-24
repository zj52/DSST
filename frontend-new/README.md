# Digit Symbol Substitution Test (DSST) Application

This web application provides a digital implementation of the Digit Symbol Substitution Test (DSST), a neuropsychological assessment tool used to measure cognitive processing speed, attention, and visual-motor coordination.

## Live Demo

**[Try the DSST Application →](https://github.com/USER_NAME/DSST)**

## Features

- **Interactive DSST Assessment**: Users match symbols with corresponding digits within a time limit
- **Admin Dashboard**: View test results and statistics
- **Configurable Settings**: Admins can customize redirect URLs and cutoff times
- **Responsive Design**: Works on both desktop and mobile devices
- **Secure Authentication**: Different access levels for users and administrators
- **Data Export**: Export test results to CSV for further analysis

## User Guide

### For Test Takers

1. **Login**: 
   - Username: `user`
   - Password: `sleepisgood`

2. **Taking the Test**:
   - Review the symbol key at the top of the screen
   - Type the corresponding digit (1-9) for each symbol displayed
   - Use arrow keys to navigate between boxes
   - Complete as many matches as possible within the 90-second time limit
   - Click "Submit" when finished or wait for the timer to complete

3. **After Completion**:
   - Redirects to questionnaire specified by administrator

### For Administrators

1. **Login**: 
   - Username: `admin` 
   - Password: `sleepisgood`

2. **Admin Features**:
   - View all test results in a sortable table
   - Configure redirect URL for completed assessments
   - Set daily cutoff time (when test becomes unavailable)
   - Export results to CSV format
   - View summary statistics (average score, time spent, etc.)

## Specification

The DSST application was developed according to the following specification:

1. **Assessment Format**:
   - Symbol-to-digit matching paradigm
   - 90-second time limit
   - Continuous addition of new symbol boxes

2. **User Flow**:
   - Login authentication
   - Clear instructions before starting
   - Active assessment period
   - Completion and redirect to follow-up questionnaire

3. **Admin Capabilities**:
   - Configurable redirect URL
   - Setting daily cutoff times with timezone handling
   - Data visualization and export

For more detailed information, see the [full specification document](docs/DSST_SPEC.md).

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/[YOUR-USERNAME]/DSST.git
   cd DSST/frontend-new
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to http://localhost:3000

## Deployment

### Build for Production

To create a production build:

```bash
npm run build
```

This will create a `build` directory with optimized files ready for deployment.

### Deploy to GitHub Pages

1. Update the `homepage` field in `package.json`:
   ```json
   "homepage": "https://[YOUR-USERNAME].github.io/DSST"
   ```

2. Install the GitHub Pages package:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add deployment scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

4. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## License

This project is open source and available under the MIT License.

## Acknowledgements

- Developed as a project for cognitive assessment in sleep research
- Built with React, TypeScript, and Tailwind CSS
