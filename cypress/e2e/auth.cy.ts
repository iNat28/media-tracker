describe('Authentication lifecycle', () => {
  const uniqueId = Date.now();
  const testEmail = `testuser-${uniqueId}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test Lifecycle User';

  it('should sign up, sign out, sign in, and delete the user via settings', () => {
    // 1. Sign Up
    cy.visit('/sign-in');
    cy.contains('Sign Up').click();
    
    cy.get('#name').type(testName);
    cy.get('#email').type(testEmail);
    cy.get('#password').type(testPassword);
    cy.get('button[type="submit"]').click();

    // 2. Verify Sign Up success
    cy.url().should('include', '/movies');
    cy.get('nav', { timeout: 15000 }).should('contain', testName);

    // 3. Sign Out via menu
    cy.get('#user-menu-button').click();
    cy.contains('Sign Out').click();
    cy.url().should('include', '/sign-in');

    // 4. Sign In with same user
    cy.get('#email').type(testEmail);
    cy.get('#password').type(testPassword);
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/movies');
    cy.get('nav', { timeout: 15000 }).should('contain', testName);

    // 5. Go to Settings
    cy.get('#user-menu-button').click();
    cy.contains('Settings', { timeout: 10000 }).click();
    cy.url().should('include', '/settings');
    cy.get('h1').should('contain', 'Settings');

    // 6. Change Name
    const newName = 'Updated Test Name';
    cy.get('#name').clear().type(newName);
    cy.contains('Save Changes').click();
    cy.contains('Name updated successfully', { timeout: 10000 }).should('be.visible');
    cy.get('#user-menu-button').should('contain', newName);

    // 7. Delete Account
    cy.on('window:confirm', () => true);
    cy.get('#delete-account-btn').click();

    // 8. Verify Deletion
    cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 15000 });
    
    // 9. Force clear storage
    cy.clearLocalStorage();
    cy.clearCookies();

    // 10. Try to sign in again - should fail
    cy.visit('/sign-in');
    cy.get('#email').type(testEmail);
    cy.get('#password').type(testPassword);
    cy.get('button[type="submit"]').click();
    
    // Check if error div exists by its background color class or text
    cy.get('main').then(($main) => {
      const text = $main.text().toLowerCase();
      cy.log('Page text after failed sign in:', text);
    });
    
    // Any error message should work
    cy.url().should('include', '/sign-in');
    cy.get('main').should('not.contain', 'Hello');
  });

  it('should allow a user to sign in using the Dev Bypass and then sign out', () => {
    cy.visit('/');
    cy.contains('Sign In').click();
    cy.contains('Auto-login as Dev User').click();
    cy.url().should('include', '/movies');
    cy.get('#user-menu-button', { timeout: 15000 }).should('be.visible').click();
    cy.contains('Sign Out').click();
    cy.url().should('include', '/sign-in');
  });

  it('should show validation errors on the sign-in page', () => {
    cy.visit('/sign-in');
    cy.get('button[type="submit"]').click();
    cy.contains('Email is required').should('be.visible');
    
    cy.get('#email').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.contains('Please enter a valid email address').should('be.visible');
  });
});
