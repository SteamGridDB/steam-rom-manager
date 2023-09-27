//Pegasus Symlinks
const gameData = listItem.shortcuts.fileData.shortcuts;

gameData.forEach((game) => {
  const imgIcon = game.icon;
  const imgHero = imgIcon.replace("icon", "hero"); // screenshot
  const imgLogo = imgIcon.replace("icon", "logo"); // wheel
  const imgVertical = imgIcon.replace("_icon", "p"); // boxFront
  const imgPeriod = imgIcon.replace("_icon", ""); // Grid

  const romPath = game.exe
	.split('"')
	.filter((item) => item !== "")
	.pop()
	.match("^(.*/)")[0];

  const romName = game.exe
	.split('"')
	.filter((item) => item !== "")
	.pop()
	.match("/([^/]+)$")[1]
	.replace(/\..+$/, "");

  //Folders

  var dir = romPath +"media/"+romName;
  if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir);
  }

  const symlinkScreenshot = romPath +"media/"+romName + "/screenshot.png";
  const symlinkWheel = romPath +"media/"+romName + "/logo.png";
  const symlinkBoxFront = romPath +"media/"+romName + "/boxFront.png";
  const symlinkGrid = romPath +"media/"+romName + "/steam.png";

  fs.symlink(imgHero, symlinkScreenshot, "file", (error) => {
	if (error) {
	  console.error(error);
	}
  });
  fs.symlink(imgLogo, symlinkWheel, "file", (error) => {
	if (error) {
	  console.error(error);
	}
  });
  fs.symlink(imgVertical, symlinkBoxFront, "file", (error) => {
	if (error) {
	  console.error(error);
	}
  });
  fs.symlink(imgPeriod, symlinkGrid, "file", (error) => {
	if (error) {
	  console.error(error);
	}
  });
});
