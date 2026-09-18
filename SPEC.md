Build a polished QR code application called SweetQR.

The application should feel like a premium, modern utility product for creating and scanning QR codes.

Tech stack:
- Nuxt 4
- TypeScript
- TailwindCSS
- shadcn-vue
- Use Nuxt best practices and composables where appropriate

For this first version, build a fully functional frontend/local-first MVP. Do not add authentication, a database, or a backend unless genuinely required.

CORE FEATURES

1. QR Generator
Support:
- URL
- Plain Text
- Wi-Fi
- Contact/vCard
- Email
- Phone
- SMS
- Location

Each QR type should have a dedicated form with appropriate fields. Generate the correct QR payload from the form data.

2. QR Customization
Allow users to customize:
- Foreground color
- Background color
- Dot style
- Corner style
- QR size
- Margin
- Error correction level
- Optional center logo upload

Changes should update the QR preview in real time.

3. Export
Allow downloading generated QR codes as:
- PNG
- SVG

Include configurable size and margin.

4. QR Scanner
Support:
- Camera scanning
- Uploading an image containing a QR code

After scanning:
- Decode the QR code
- Detect the content type where possible
- Display the result in a useful format
- Provide relevant actions such as Copy, Open, or Save

Do not automatically open scanned URLs.

5. Local QR Management
Allow users to save generated QR codes locally.

Features:
- Search
- Filter by QR type
- Favorite
- Rename
- Edit
- Duplicate
- Delete

Persist data using browser storage.

6. Scan History
Store scan history locally with:
- Result
- Content type
- Time scanned

Allow:
- Copy
- Open
- Delete individual items
- Clear all history

Include a privacy setting to disable history.

7. UI/UX
Create:
- Responsive app layout
- Sidebar navigation
- Dashboard
- Generator page
- My QR Codes page
- Scanner page
- Scan History page
- Settings page

Include:
- Empty states
- Helpful onboarding
- Loading states
- Error states
- Form validation
- Keyboard accessibility
- Responsive mobile design
- Dark and light mode

ENGINEERING REQUIREMENTS

Before implementing:
1. Inspect the existing project.
2. Create a concise implementation plan.
3. Identify appropriate libraries for QR generation, customization, and scanning.
4. Explain why the selected libraries are appropriate.

Then implement the project incrementally.

Do not build everything in one giant component.
Use clear component boundaries and reusable composables/utilities.

After implementation:
1. Run type checking.
2. Run the production build.
3. Fix errors.
4. Review the implementation for duplicated logic and obvious bugs.

Do not claim something works unless you have tested or validated it where possible.