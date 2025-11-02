Feature: Landing Page Core Functionality
  As a user visiting the landing page
  I want to see all essential elements
  So that I can understand the product and take action

  Background:
    Given the landing page is loaded

  Scenario: Page loads successfully
    When I visit the landing page
    Then I should see the page title
    And I should see the hero section
    And I should see navigation elements

  Scenario: Hero section displays correctly
    When I look at the hero section
    Then I should see a compelling headline
    And I should see a clear subheadline
    And I should see a primary call-to-action button
    And I should see supporting visual content

  Scenario: Core utilities work correctly
    When the page initializes
    Then the className utility should merge classes properly
    And date validation should work for ISO formats
    And contrast checking should be available
