let reposSwiper = []
let repos
let activeIndex
let activeRepo
let clearConsole = false
let pluginInstalled = false

window.onbeforeunload = async (e) => {
  e.returnValue = false;
  window.electronAPI.quitPluginLibrairy(pluginInstalled)
}


document.getElementById("parameters").addEventListener("click", async (event) => {
  await window.electronAPI.pluginLibrairyParameters()
})


function setRepoDescription (repo) {

  let tabcontent = document.getElementsByClassName("item");
  for (i = 0; i < tabcontent.length; i++) {
    if (tabcontent[i].value === repo.name) break
  }
  if (tabcontent[i] && tabcontent[i].hasChildNodes()) {
    // addBorder (tabcontent[i].firstChild)
    setSwiperRepo(repo)
  }
  setGithubInfo (repo)
  reposSwiper[repo.index].slideTo(0,500,true)
}


function setGithubInfo (repo) {
  document.getElementById('github-name').innerHTML = repo.name
  document.getElementById('github-login').innerHTML = repo.login
  document.getElementById('member-since').innerHTML = repo.member_since
  document.getElementById('nb-plugins').innerHTML = repo.repos.length
}


async function installPlugin(index, pos) {
  repos[index].repos[pos].elem = "installed"+index+"-"+pos;
  await window.electronAPI.initPluginInstallation(repos[index].repos[pos]);
  repos[index].repos[pos].exists = true;
}


function addBorder (item) {
  removeBorders()
  item.className += ' img-border'
}


function setSwiperRepo (repo) {

  let tabcontent = document.getElementsByClassName("container");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = (tabcontent[i].value === repo.name) ? "block" : "none"
  }

}


function removeBorders () {
  let tabcontent = document.getElementsByClassName("img-border");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].className = tabcontent[i].className.replace(' img-border', '');
  }
}


function setLangTargets() {
  return new Promise(async (resolve) => {
    document.getElementById('label-info').innerHTML = await Lget("pluginLibrairy", "github")
    document.getElementById('login').innerHTML = await Lget("pluginLibrairy", "login")
    document.getElementById('member').innerHTML = await Lget("pluginLibrairy", "member")
    document.getElementById('dispo-plugin').innerHTML = await Lget("pluginLibrairy", "dispoPlugins")
    resolve()
  })
}


async function Lget (top, target, param) {
    if (param) {
        return await window.electronAPI.getMsg([top+"."+target, param])
    } else {
        return await window.electronAPI.getMsg(top+"."+target)
    }
}


async function start() {

  await setLangTargets()
  await addSwiper()

  setWiper(0, async () => {
    await window.electronAPI.closeInitPluginLibrairy()
    
    if (clearConsole) console.clear()
    if (repos.length > 0) {
      setRepoDescription(repos[0])
      animation ("0-0", "marquee0-0")
    }
    window.resizeTo(window.outerWidth + 5, window.outerHeight + 5);
  })

}


function addSwiper () {

  return new Promise((resolve) => {

    let body = document.getElementById('body')

    for (let index=0; index<repos.length; index++) {
    
      let container = document.createElement('container');
      container.className = 'container';
      container.value = repos[index].name;
      container.setAttribute('id', 'container'+index);

      let swiper = document.createElement("div");
      swiper.className = 'swiper-container swiper-container'+index;
      swiper.setAttribute('id', 'swiper-container'+index);

      let swiperWrapper = document.createElement("div");
      swiperWrapper.className = 'swiper-wrapper swiper-wrapper'+index;

      let swiperPagination = document.createElement("div");
      swiperPagination.className = 'swiper-pagination swiper-pagination'+index;
      swiper.setAttribute('id', 'swiper-pagination'+index);

      swiper.appendChild(swiperWrapper);
      swiper.appendChild(swiperPagination);
      container.appendChild(swiper);
      body.appendChild(container)

      let swiperContainer = new Swiper(".swiper-container"+index, {
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: "auto",
        coverflowEffect: {
          rotate: 20,
          stretch: 0,
          depth: 350,
          modifier: 1,
          slideShadows: true
        },
        pagination: {
          el: ".swiper-pagination"+index
        }
      });

      reposSwiper.push(swiperContainer)
      if (index+1 === repos.length) resolve()
    }
  })
}
  

function setWiper(index, callback) {

    if (index === repos.length) return callback()

    setSlides(index, 0, () => {
      document.getElementById('container'+index).style.display = "block"
      reposSwiper[index].update()
      document.getElementById('container'+index).style.display = "none"
      setWiper(++index, callback)
    }) 

}


function setSlides(index, pos, callback) {
  if (pos === repos[index].repos.length) return callback()
  setSlide(index, pos, callback) 
}


async function setSlide(index, pos, callback) {

    if (pos === 0) {
      activeIndex = 0;
      activeRepo = 0;
      reposSwiper[index].off('slideChange');
      reposSwiper[index].removeAllSlides();
      reposSwiper[index].update();
    }

    let lastupated = await Lget("pluginLibrairy", "lastUpdate")
    let alreadyInstalled = await Lget("pluginLibrairy", "alreadyInstall")
    let installButton = await Lget("pluginLibrairy", "installButton")

    let slide = '<div class="swiper-slide"><div class="titles"><h3 class="name">Plugin '+repos[index].repos[pos].name.replace('A.V.A.T.A.R-plugin-','')+'</h3><h3 class="description">'+repos[index].repos[pos].description+'</h3><h3 class="date">'+lastupated+" "+repos[index].repos[pos].updated_at+'</h3></div>'
  
    slide = slide+'<div class="exists" id="installed'+index+"-"+pos+'"><p class="blink">'+alreadyInstalled+'</p></div>'

    let image = await ImageExists(repos[index].repos[pos].image_url)
    if (image !== false) {
      slide = (repos[index].repos[pos].noInfo === false)
       ? slide+'<div class="marquee-wrap"><div class="marquee" id="marquee'+index+"-"+pos+'"><p class="picture"><img class="img-program" src='+image+' alt=""></p><p class="detail" id="detail'+index+"-"+pos+'">'+repos[index].repos[pos].info+'</p></div></div>'
       : slide+'<div class="marquee-wrap"><div class="marquee" id="marquee'+index+"-"+pos+'"><p class="picture-no-description"><img class="img-program" src='+image+' alt=""></p><p class="detail" id="detail'+index+"-"+pos+'">'+repos[index].repos[pos].info+'</p></div></div>'
    } else {
      clearConsole = true
      slide = slide+ '<div class="marquee-wrap"><div class="marquee" id="marquee'+index+"-"+pos+'"><p class="detail" id="detail'+index+"-"+pos+'">'+repos[index].repos[pos].info+'</p></div></div>'
    }
    slide = slide+ '<div class="div-record"><x-button class="record" id="record'+index+"-"+pos+'"><x-icon href="#history-redo"></x-icon><x-label>'+installButton+'</x-label></x-button></div></div>'

    reposSwiper[index].appendSlide(slide);
    reposSwiper[index].update();

    if (repos[index].repos[pos].exists === true) document.getElementById("installed"+index+"-"+pos).style.display = "block"

    document.getElementById("record"+index+"-"+pos).addEventListener('click', async (_event) => {
      let index = _event.target.id.replace('record','').split('-')
      installPlugin(index[0], index[1])
    })

    if (pos === 0) {
      animation(index+"-"+reposSwiper[index].activeIndex, "marquee"+index+"-"+reposSwiper[index].activeIndex);
      reposSwiper[index].on('slideChange', function () {
        if (document.getElementById('marquee'+index+"-"+activeIndex)) {
          document.getElementById('marquee'+index+"-"+activeIndex).removeEventListener('mouseover', slide_mouseover)
          document.getElementById('marquee'+index+"-"+activeIndex).removeEventListener('mouseleave', slide_mouseleave)
          document.getElementById("marquee"+index+"-"+activeIndex).style.animation = ""
        }
        activeIndex = reposSwiper[index].activeIndex
        activeRepo = index
        animation(activeRepo+"-"+activeIndex, "marquee"+activeRepo+"-"+activeIndex)
      })
    }

    setSlides(index, ++pos, callback)
}


function slide_mouseover () {
  document.getElementById("marquee"+activeRepo+"-"+activeIndex).style.animationPlayState = "paused"
}

function slide_mouseleave () {
  document.getElementById("marquee"+activeRepo+"-"+activeIndex).style.animationPlayState = "running"
}

function animation (index, item) {
  if (document.getElementById("detail"+index).clientHeight >= 180) {
    document.getElementById(item).style.animation = "scrollUp 20s linear 5s infinite"
    document.getElementById(item).addEventListener('mouseover', slide_mouseover)
    document.getElementById(item).addEventListener('mouseleave', slide_mouseleave)
  }
}


function ImageExists(url) {
    return new Promise((resolve) => {
      let test = new Image()
      test.onload = () => {resolve (test.src)}
      test.onerror = () => {resolve (false)}
      test.src = url
    })
}
  

async function loginForm () {

  let menuRepos = document.getElementById('mouse-drag');
  repos.forEach(repo => {
      let menuitem = document.createElement("div");
      menuitem.className = 'item';
      menuitem.value = repo.name;
      let img = document.createElement("img");
      img.className = 'img-repo';
      img.setAttribute('id', repo.name);
      img.style.cursor = "pointer";
      img.setAttribute('src', repo.avatar);
      img.addEventListener('click', () => {
          setRepoDescription(repo)
      })
      menuitem.appendChild(img);
      menuRepos.appendChild(menuitem);
  })

  slider = tns({
      "container": "#mouse-drag",
      "items": 3,
      "mouseDrag": false,
      "controlsText": ["<<",">>"],
      "slideBy": "page",
      "swipeAngle": true,
      "speed": 400,
      "loop": false
  })

  await start();

  slider.goTo(0);
   
}


window.electronAPI.onRepos(async (_event, arg) => {
  repos = arg
  loginForm() 
})


window.electronAPI.onPluginInstalled(async (_event, plugin) => {
 document.getElementById(plugin.elem).style.display = "block"
 pluginInstalled = true
})


