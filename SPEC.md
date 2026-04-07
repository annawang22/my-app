# App Specification
<!-- Populate this with your SPEC details. -->
<!-- Template created with CLAUDE for 15-113-->

## Overview

<!-- Brief description of the app, its purpose, and target audience. -->
A workout app that allows users to curate their own workouts and keep track of their workout progess and automatically changes repetitions, so that workouts continuously challenge the user towards their goals. 

## Core Features

<!-- List the main features of the app. -->
- navigation bar at the bottom with change workout button, home button, personal profile button 
- a goal page that allows user to add their workout goals (e.g. grow their glutes, prepare for a marathon) 
- on the main page (this is the page that the user first sees once they are logged in), there is the date at the top and then a list of checkboxs for that day's workout.
- if the user is new, they will be prompted to create an account. this will take up the entire screen. the user should not be able see anything but the login/create an account screen until they do so. once they log in, they will only see the main page, goal page, and profile page
    - secure authentication is extremely important. make sure that no one can access this information.
- on the personal profile page, it will say "Welcome username" and then there will be Achievements and then settings

### Entities

User 
- username: string
- password: string
- name: string


## Design & Branding

- **Color palette:**
--molten-lava: #780000ff;
--brick-red: #c1121fff;
--papaya-whip: #fdf0d5ff;
--deep-space-blue: #003049ff;
--steel-blue: #669bbcff;
- **Typography:** modern sans-serif UI font
- **Style direction:** minimilist style

## Future endeavors
<!-- Unresolved decisions or areas needing further research. -->
- main page once user is logged in:
    - there will be a list of exercise: check box stretch, check box lat pulldown 55 pounds, 3 sets 8 reps, push ups 4 sets 12 reps. when user does their workout they can check off their exercise and then it will move to the bottom of the the workout list, but it will be check off and thus, crossed out and a lighter color to illustrate this
- additionals for the workout page:
    - if they click into the goal, they can add exercises using the plus button in the lower right hand corner. this will be a separate page they see. when they add exercises, they can name their exercises, put in the amount of weight they are lifting or miles they are running or whatever is applicable to the goal, number repetitions of the exercise or amount of time it took them to run, anything that is applicable. 
    - they can also schedule in what days they want to do that workout and then they can also have the option to add in increase weights every two weeks or increase the miles i run every month, etc. once this is saved, their respective workout to each day will appear on their main page
    - they can also edit their exercises by clicking the exercises, there will be a popout of the current saved settings: "repeats every workout" "_ sets" "_ reps"
- flesh out "settings" on the personal profile page, have the achievements be consistently updated based on progress
- improve UX/UI. 
im not doing any of this just yet, but keep this in mind. 
