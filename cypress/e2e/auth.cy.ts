describe('Authentication', () => {
  it('should allow a user to sign in using the Dev Bypass and then sign out', () => {
    // 1. Visit the home page
    cy.visit('/');
    
    // 2. Click on Sign In
    cy.contains('Sign In').click();
    
    // 3. We should be on the sign-in page
    cy.url().should('include', '/sign-in');
    
    // 4. Click the Dev Bypass button
    cy.contains('Auto-login as Dev User').click();
    
    // 5. Should be redirected to /movies
    cy.url().should('include', '/movies');
    
    // 6. Navbar should show the user's name
    cy.get('nav').should('contain', 'Hello, Dev User');
    
    // 7. Sign out
    cy.contains('Sign Out').click();
    
    // 8. Should be redirected back to sign-in (because MoviesPage protects itself)
    cy.url().should('include', '/sign-in');
    
    // 9. Sign-in page should show "Sign in" title
    cy.contains('Sign in').should('be.visible');
  });

  it('should show validation errors on the sign-in page', () => {
    cy.visit('/sign-in');
    
    // Try to sign in with empty fields
    cy.get('button[type="submit"]').click();
    
    // Should show "Email is required" (based on our validateForm logic)
    cy.contains('Email is required').should('be.visible');
    
    // Try with invalid email
    cy.get('#email').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.contains('Please enter a valid email address').should('be.visible');
    
    // Try with short password
    cy.get('#email').clear().type('test@example.com');
    cy.get('#password').type('short');
    cy.get('button[type="submit"]').click();
    cy.contains('Password must be at least 8 characters long').should('be.visible');
  });
});
