**to use: literally just drag a png/jpg into this folder and then run img.js or img.bat**  

hi yeah so basically this is a program that imports pixel art into geometry dash, but also optimizes it

in other words, same-color pixels are merged together so that less objects are used

since the program takes a bit of time to look through the pixels and optimize the image, using large images is not a good idea

also currently the optimization system is pretty basic, but feel free to drop a PR if you found a less braindead approach

**as usual, node js is required. you can download it uhhhhhhh on the internet**

happy painting and god bless

Oh yeah, if you're on Linux or using any form of Steam Play for that matter, tweak line 16 to look something like this:

```
let gdLevels = "/home/$USER/.steam/steam/steamapps/compatdata/322170/pfx/drive_c/users/steamuser/AppData/Local/GeometryDash/CCLocalLevels.dat"
```
