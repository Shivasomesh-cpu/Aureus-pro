# Software Requirements Specification (SRS) for Aureus

## 1. Introduction

### 1.1 Purpose
This document explains what our software, Aureus, is supposed to do. Aureus is a personal finance app that helps people take control of their money. Instead of just looking back at what you already spent like an old receipt book, Aureus looks forward to help you make better choices. It uses simple machine learning to look at your past spending habits and figure out the best ways for you to save money, pay off debt, and stick to a budget. This document acts as a guide for anyone working on the project so we all know exactly what features to build and what rules the app needs to follow.

### 1.2 Audience
The main people who will use Aureus are everyday people, like young adults starting their careers, families trying to manage their household bills, or anyone who really wants to get out of debt. These people usually find regular budgeting spreadsheets too boring or hard to keep up with. They want an app that does the hard math for them. By making things like debt-to-income ratios and spending patterns easy to understand, Aureus helps normal people without a finance degree build good money habits. We want the app to adapt to how they actually spend, rather than forcing them to follow a strict, unrealistic budget.

### 1.3 Scope
Aureus gives users a bunch of helpful tools to manage their money in one place. People can add all their income, regular bills, and daily expenses into the app. The app then looks at when and where they spend the most money—like if they always buy expensive coffee on Tuesdays—to help them see their bad habits. It also includes features that automatically suggest changes to their budget, warns them if they are paying for subscriptions they haven't used in two months, and calculates the fastest way to pay off their loans. Right now, the app won't connect directly to actual bank accounts or send real money; those features are outside the scope of this current project phase.

### 1.4 Definitions and Acronyms
There are a few special terms we use in this project. "Behavioral DNA" is just our way of describing a user's unique spending style, like what categories they overspend in and how good they are at saving. "Spending Velocity" is a way to track how fast someone is burning through their money day by day, so we can warn them before they go broke. The "Health Trajectory" is a prediction of how financially healthy the user will be in 90 days if they keep up their current habits. Finally, "Debt Avalanche" and "Debt Snowball" are just two popular math tricks for paying off loans; avalanche means paying off the highest interest rate first to save money, and snowball means paying off the smallest loan first to feel good about making progress.

## 2. Overall Description

### 2.1 Product Features
Aureus has a few main parts that all work together. First is the main transaction ledger. This is where users can add, view, edit, or delete their daily expenses, sorting them into fifteen simple categories like food, travel, or bills. Then, there is the Financial Health score. The app looks at things like how much money the user has in emergencies and how much debt they have, and gives them a simple grade out of 100. 

Another big feature is the Debt Engine. If a user has a credit card, a car loan, and student debt, the app will crunch the numbers and tell them exactly how much to pay on each one every month to get out of debt as fast as possible. There is also an Auto-Budget feature. Instead of setting a budget once and forgetting it, the app looks at what the user actually spent over the last 30 days and suggests realistic tweaks. Finally, the Subscription tracker automatically finds monthly charges like Netflix or gym memberships in the user's history and warns them to cancel if they haven't been using them for a couple of months.

### 2.2 User Characteristics and Expectations
Because this app deals with people's money, the users are going to expect it to be perfectly accurate. They won't accept missing data or wrong math. Since money is also a very private topic, users will expect their information to be super safe and kept totally secret. They also want an app that is easy to look at. Even though the app is doing a lot of complicated math in the background, the screen should look clean and simple. The app needs to be fast and not freeze up, so people feel calm and in control when they use it.

### 2.3 Operating Environment
Aureus is built to be a web app, which means people can use it on any device that has a modern web browser, like a laptop or a smartphone. The screens will use standard web tools like HTML Canvas to draw nice charts and graphs of the user's spending. Behind the scenes, the server will run on Node.js, which is great for handling lots of small updates very quickly without slowing down. The database needs to be fast at looking up history, so we can quickly calculate those past 30-day spending trends without making the user wait.

### 2.4 Design and Implementation Constraints
We have to follow some strict rules when building this to make sure it works right. First, every single date and time has to be saved in the standard ISO 8601 format. This just means the dates will always look the same, even if users are in different time zones, preventing confusing bugs. Second, all money amounts have to be saved as whole numbers, representing cents. This is a common programming trick to stop computers from making tiny rounding errors when dealing with decimals. Lastly, the app has to do most of its smart calculations locally. We will only use outside AI tools at the very end to help translate the math into friendly advice sentences for the user.

## 3. Functional Requirements

### 3.1 Tracking Transactions
    The app needs to let users enter their purchases and automatically sort them. When a user logs a purchase, the app will also immediately update how fast they are spending their money this month. For example, a user might type in that they spent 50 dollars at the grocery store today. The app takes that information, saves the date and the amount, and checks to see if 50 dollars is normal for their food budget. If it is way higher than usual, the app updates their overall spending speed so it can warn them later if they are going too fast.

### 3.2 Auto-Adjusting Budgets
Every week, the app will run a background check on the user's spending from the last 30 days. It compares what they actually bought against the budget limits they set. If things don't match up, the app creates a list of suggested changes. For instance, if a user always spends 50 dollars less than they planned on clothes, but always spends 50 dollars more on eating out, the app will notice this trend. It will suggest moving that 50 dollars from the clothing budget to the food budget. This helps the user have a realistic budget they can actually stick to, without feeling guilty.

### 3.3 The Debt Payoff Calculator
This part of the app collects all the user's different loans and creates a master plan to pay them off. The app needs to know the total amount owed, the interest rate, and the minimum monthly payment for each loan. When the user picks a strategy, like the debt avalanche, the app does all the complicated math. It figures out exactly how much extra money should go to the highest-interest credit card this month, while making sure the minimums on the other loans are still paid. It then shows the user a simple month-by-month calendar of exactly what to pay until they are totally debt-free.

### 3.4 Health Scores and Warnings
The app will constantly check a few key numbers—like how much is in the user's savings account versus how much debt they have—to give them an overall health score from zero to 100. It also watches out for danger signs. If the user had to pay for a big car repair and their emergency savings dropped to almost zero, the app will notice that the threshold was crossed. It will send a friendly but firm warning that their emergency fund is too low and automatically drop their health score until they build their savings back up.

### 3.5 Managing Subscriptions
The app needs to read through the user's spending history to spot recurring bills that happen every single month. Once it finds them, it keeps an eye on them. If the app sees that the user is paying 15 dollars a month for a movie service, but hasn't seen any other signs that they are actually using it for 60 days, it marks that subscription as "unused." It will then pop up a message asking the user if they want to cancel it. This is a simple way the app helps users stop wasting money on things they forgot about.

## 4. Non-Functional Requirements

### 4.1 Speed and Performance
The app needs to feel snappy. When a user types in a new expense, the app must save it and update the screen in under 150 milliseconds, which is basically instantly. When the app is doing heavy math, like projecting a five-year debt payoff plan with a bunch of different loans, it needs to finish all those calculations in under 300 milliseconds. Finally, when the user first opens the app, the main dashboard and all the colorful charts need to load and appear on the screen in just over a second, even on a regular home internet connection.

### 4.2 Security Rules
Because we are handling financial data, security is the top priority. Any data sent between the user's phone and our servers must be locked up tight using modern TLS 1.3 encryption, which stops hackers from listening in. When we actually save the user's budget rules and account totals in our database, we have to scramble the data using AES-256 encryption. To keep people from breaking into accounts, the app will use secure login tokens that automatically expire after 24 hours. If a user leaves their laptop open at a coffee shop, the app will log them out eventually to keep their data safe.

### 4.3 Data Privacy
We have to respect people's privacy laws, like the GDPR and CCPA. This means if a user decides they don't want to use Aureus anymore, the app must have a way to completely and permanently delete all their personal data from our servers. We aren't allowed to just hide it; it has to be gone forever. Also, the app will keep an internal log of major changes, like when the algorithm automatically changes a budget limit. We will keep these logs for 90 days so we can fix bugs if something goes wrong, but then we will securely delete old logs to save space and protect privacy.

## 5. External Interface Requirements

### 5.1 How the App Looks (UI)
The design of the app has to look good and work perfectly on any screen size. Whether a user is checking their budget on a tiny smartphone screen or looking at deep analytics on a giant desktop monitor, the layout needs to adapt smoothly. For the graphs that show spending trends over time, the app needs to use web tools that draw graphics very fast, so the page doesn't get choppy when the user scrolls. Finally, when the app wants to warn the user about something, it shouldn't block the whole screen. It should use polite little pop-up notifications that the user can swipe away or snooze for later.

### 5.2 Connecting to Other Software (APIs)
Our app will need to talk to some other programs to work its magic. To turn all our math into friendly advice, our backend server will send requests over the internet to a smart AI language model. We will ask it to read the data and send back a helpful paragraph for the user. When our app talks to its own database, it has to use a strict set of rules called parameterized queries. This is a coding safety measure that makes it impossible for bad guys to sneak malicious code into our database when they fill out a form.

### 5.3 Hardware Needs
Aureus doesn't need any special equipment to run. The users don't have to buy anything extra. The whole app works just fine using the standard parts of a regular phone or computer, like a normal keyboard, a mouse, or a touchscreen. We are building it so that any standard device you can buy at a store today has more than enough power to run the app smoothly.
