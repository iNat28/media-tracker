describe('Authentication lifecycle', () => {
  const uniqueId = Date.now();
  const testEmail = `testuser-${uniqueId}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test Lifecycle User';

  it('should sign up, sign out, sign in, and delete the user', () => {
    // 1. Sign Up
    cy.visit('/sign-in');
    cy.contains('Sign Up').click();
    
    cy.get('#name').type(testName);
    cy.get('#email').type(testEmail);
    cy.get('#password').type(testPassword);
    cy.get('button[type="submit"]').click();

    // 2. Verify Sign Up success
    cy.url().should('include', '/movies');
    cy.get('nav', { timeout: 10000 }).should('contain', testName);

    // 3. Sign Out
    cy.contains('Sign Out').click();
    cy.url().should('include', '/sign-in');

    // 4. Sign In with same user
    cy.get('#email').type(testEmail);
    cy.get('#password').type(testPassword);
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/movies');
    cy.get('nav', { timeout: 10000 }).should('contain', testName);

    // 5. Delete Account
    cy.on('window:confirm', () => true);
    cy.get('#delete-account-btn').click();

    // 6. Verify Deletion redirect
    cy.url().should('not.include', '/movies');
    
    // 7. Force clear storage
    cy.clearLocalStorage();
    cy.clearCookies();

    // 8. Try to sign in again - should show error
    cy.visit('/sign-in');
    cy.get('#email').type(testEmail);
    cy.get('#password').type(testPassword);
    cy.get('button[type="submit"]').click();
    
    // 9. Debug: check URL and content
    cy.url().then((url) => {
      cy.log('Current URL after failed sign in attempt:', url);
    });
    
    // If it stays on sign-in, it should show some message
    cy.url().should('include', '/sign-in');
    // better-auth usually returns "Invalid email or password" for non-existent users too
    cy.get('main').should('not.contain', 'Hello,');
  });

  it('should allow a user to sign in using the Dev Bypass and then sign out', () => {
    cy.visit('/');
    cy.contains('Sign In').click();
    cy.contains('Auto-login as Dev User').click();
    cy.url().should('include', '/movies');
    cy.get('nav', { timeout: 10000 }).should('contain', 'Dev User');
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
