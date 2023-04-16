---
layout: '../../layouts/PostLayout.astro'
title: 'Remoting into CSL at UW - Madison through VSCode Remoter Explorer'
description: "CSL is UW's virtual Linux solution. It's used in nearly all levels of classes at UW. However, it can be sluggish and development time can be compromised by requiring predisposed knowledge to CLI tools, like VIM, GDB, and so forth."
pubDate: 'April 16 2023'
heroImage: '/bascom-fall.jpg'
---

It is impossible to avoid using CSL if you want to maintain a semblance of a good grade at the University of Wisconsin - Madison. The reasoning is simple: a lot of programming projects have nifty autograders, but naturally these autograders cannot possible account for every version or permutation of a problem. Hence, it's heavily suggested to do all development on the university's CSL machines (virtual linux instances) as the versions of software provided are guaranteed to work per the grading specifications.

The problem with this, is that (traditionally) you are restricted to a CLI environment, which can make fast development cumbersome at best, even with working knowledge of powerful tools like VIM and GDB. For me personally, I have become quite accustom to VSCode and the tooling available. Fortunately, there is a way to get the best of both worlds: you can remote into CSL machines through VSCode, and use all of it's powerful plugins as a consequence.

The idea stems from using Remote Explorer in VSCode on your local machine. With just an SSH connection, you get access to a full VSCode instance on a remote machine! Making this work with the university is it's own challenge, though. After inputting SSH credentials, a plethora of things can go wrong:

- Installing the VSCode server plugin can fail, or corrupt, causing the need for a manual restart

Probably the most common (and most tedious fix) is that in the initial installation _something_ corrupts. Unfortunately, the only way to fix this is to SSH in and navigate to `~/vscode/bin/<hash in question>` and purge all files. If this isn't done, the plugin will read the cached files and blow up, every time.

This can also happen if the remote connection doesn't close out properly (and the .lock file still exists). In this case, you have to navigate to the same directory and delete the matching .lock file `~/vscode/bin/<hash>.lock`

- Recursively asking for credentials upon entering a folder

There doesn't seem to be a good fix for this, as it seems to be an issue with how files are fetched on the network. Your only real hope is to terminate the connection, and try again.

Despite these odd issues, when the connection does work, you gain access to all of the virtual linux software inside of vscode, which can optimize your workflow exponentially!
