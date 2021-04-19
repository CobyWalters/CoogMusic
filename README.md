DEV GUIDE

Installation:

    1 ) Install git - https://git-scm.com/downloads
        git --version

    2) If using VSCode, install extensions:
        GitHub
        GitHub Pull Requests and Issues
        Live Server

    3) In the bottom left, click the profile icon and sign into GitHub

    4) Change your default terminal to git bash
        Ctrl + Shift + P -> Terminal: Select Default Shell -> Git Bash


Git Hub:

    SETUP

    1 ) Set your global variables
        git config --global user.name "<username>"
        git config --global user.email "<email>"

    2 ) Need help with an action?
        git help <verb>

    3 ) Open terminal through VSCode in your project directory, your path should look like:
        C://something/CoogMusic

    4 ) Clone our remote repository to your project directory
        git clone https://github.com/CobyWalters/CoogMusic.git .

    5 ) Create a .gitignore file to specify local files not intended for pushing (optional)
        touch .gitignore

    STAGING AREA (building your commit)

    1 ) View the status of your staging area
        git status
    
    2 ) Add a specific file to the staging area
        git add filename
    
    3 ) Add all files to the staging area (except the ones specified in .gitignore)
        git add -A

    4 ) Remove  a file from the staging area
        git reset filename
    
    5 ) Remove all files from the staging area
        git reset
    
    6 ) View your changes to the code
        git diff

    7 ) Once you are happy with your staging area, initialize a commit
        git commit -m "<commit_message>"

    BRANCHES
    1 ) Create a branch for your desired featu
        git branch <branch_name>
    
    2 ) Designate that as your current working branch
        git checkout <branch_name>

    3 ) View all (local and remote) branches
        git branch -a

    PUSHING CHANGES

    1 ) Pull any new changes from the main branch before pushing
        git pull origin main

    2 ) To push your branch to the main branch:
        git push -u origin <branch_name>

    3 ) To push the entire local repository:
        git push origin main

    FINALLY

    1 ) To stop tracking this project with git:
        rm -rf .git


Local Host:

    1 ) Local host (https://localhost:5000)
        nodemon app.js 