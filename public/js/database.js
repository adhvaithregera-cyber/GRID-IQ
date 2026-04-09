/* ============================================================
   GRIDIQ_DATABASE — 2026 Season Live Data
   Last synced: 31 March 2026 (after Round 3 — Japanese GP)
   Source: Ergast F1 API (jolpi.ca) + public race reports
   ============================================================ */

const GRIDIQ_DATABASE = {
  season: 2026,
  racesCompleted: 3,   // Update this after each race weekend

  /* ── 2026 RACE CALENDAR — 22 ROUNDS ────────────────────── */
  races: [
    {
      round:1,  id:"AUS", name:"Australian GP",    country:"Australia",    city:"Melbourne",
      circuit:"Albert Park Circuit",       date:"2026-03-08", laps:58, length:5.278, flag:"🇦🇺",
      trackType:"balanced",  preferredAeroMode:"Z", drsZones:4, tireWear:"medium",
      winner:"Russell", status:"completed",
      desc:"Street-park hybrid with a sweeping back sector. Z-mode downforce dominates the technical turn sequences."
    },
    {
      round:2,  id:"CHN", name:"Chinese GP",       country:"China",        city:"Shanghai",
      circuit:"Shanghai International Circuit",date:"2026-03-15", laps:56, length:5.451, flag:"🇨🇳",
      trackType:"balanced",  preferredAeroMode:"X", drsZones:2, tireWear:"medium",
      winner:"Antonelli", status:"completed",
      desc:"Long back straight rewards X-mode aerodynamics and pure powertrain output from Turn 14."
    },
    {
      round:3,  id:"JPN", name:"Japanese GP",      country:"Japan",        city:"Suzuka",
      circuit:"Suzuka Circuit",            date:"2026-03-29", laps:53, length:5.807, flag:"🇯🇵",
      trackType:"technical", preferredAeroMode:"Z", drsZones:2, tireWear:"high",
      winner:"Antonelli", status:"completed",
      desc:"The ultimate driver's circuit. Suzuka's Esses and 130R define champions. Z-mode mastery is essential."
    },
    {
      round:4,  id:"MIA", name:"Miami GP",         country:"USA",          city:"Miami",
      circuit:"Miami International Autodrome",date:"2026-05-03", laps:57, length:5.412, flag:"🇺🇸",
      trackType:"balanced",  preferredAeroMode:"X", drsZones:3, tireWear:"medium",
      winner:null, status:"upcoming",
      desc:"Purpose-built circuit blending power straights with a technical stadium section. X-mode speed is rewarded."
    },
    {
      round:5,  id:"CAN", name:"Canadian GP",      country:"Canada",       city:"Montreal",
      circuit:"Circuit Gilles Villeneuve", date:"2026-05-24", laps:70, length:4.361, flag:"🇨🇦",
      trackType:"power",     preferredAeroMode:"X", drsZones:2, tireWear:"medium",
      winner:null, status:"upcoming",
      desc:"Stop-and-go layout with long straights. X-mode acceleration out of the hairpin chicanes is decisive."
    },
    {
      round:6,  id:"MON", name:"Monaco GP",        country:"Monaco",       city:"Monte Carlo",
      circuit:"Circuit de Monaco",         date:"2026-06-07", laps:78, length:3.337, flag:"🇲🇨",
      trackType:"technical", preferredAeroMode:"Z", drsZones:1, tireWear:"low",
      winner:null, status:"upcoming",
      desc:"Maximum Z-mode downforce through the chicanes. Strategy and qualifying position are everything."
    },
    {
      round:7,  id:"ESP", name:"Spanish GP",       country:"Spain",        city:"Barcelona",
      circuit:"Circuit de Barcelona-Catalunya",date:"2026-06-14", laps:66, length:4.657, flag:"🇪🇸",
      trackType:"balanced",  preferredAeroMode:"Z", drsZones:2, tireWear:"high",
      winner:null, status:"upcoming",
      desc:"The benchmark circuit. Teams optimise setup here — high aero loads and relentless tire stress throughout."
    },
    {
      round:8,  id:"AUT", name:"Austrian GP",      country:"Austria",      city:"Spielberg",
      circuit:"Red Bull Ring",             date:"2026-06-28", laps:71, length:4.318, flag:"🇦🇹",
      trackType:"power",     preferredAeroMode:"X", drsZones:3, tireWear:"medium",
      winner:null, status:"upcoming",
      desc:"Short, punchy layout dominated by three big braking zones. X-mode straight-line speed wins."
    },
    {
      round:9,  id:"GBR", name:"British GP",       country:"Great Britain",city:"Silverstone",
      circuit:"Silverstone Circuit",       date:"2026-07-05", laps:52, length:5.891, flag:"🇬🇧",
      trackType:"balanced",  preferredAeroMode:"Z", drsZones:2, tireWear:"high",
      winner:null, status:"upcoming",
      desc:"High-speed flowing corners demand maximum mechanical grip. The Maggots-Becketts-Chapel complex is iconic."
    },
    {
      round:10, id:"BEL", name:"Belgian GP",       country:"Belgium",      city:"Spa-Francorchamps",
      circuit:"Circuit de Spa-Francorchamps",date:"2026-07-19", laps:44, length:7.004, flag:"🇧🇪",
      trackType:"power",     preferredAeroMode:"X", drsZones:2, tireWear:"medium",
      winner:null, status:"upcoming",
      desc:"Longest circuit on the calendar. Eau Rouge-Raidillon tests courage. Kemmel straight maximises X-mode."
    },
    {
      round:11, id:"HUN", name:"Hungarian GP",     country:"Hungary",      city:"Budapest",
      circuit:"Hungaroring",               date:"2026-07-26", laps:70, length:4.381, flag:"🇭🇺",
      trackType:"technical", preferredAeroMode:"Z", drsZones:1, tireWear:"high",
      winner:null, status:"upcoming",
      desc:"Twisty, low-speed circuit resembling Monaco on a larger scale. Maximum Z-mode downforce is essential."
    },
    {
      round:12, id:"NED", name:"Dutch GP",         country:"Netherlands",  city:"Zandvoort",
      circuit:"Circuit Zandvoort",         date:"2026-08-23", laps:72, length:4.259, flag:"🇳🇱",
      trackType:"technical", preferredAeroMode:"Z", drsZones:2, tireWear:"high",
      winner:null, status:"upcoming",
      desc:"Banked corners and flowing layout demand precise Z-mode aero management throughout the lap."
    },
    {
      round:13, id:"ITA", name:"Italian GP",       country:"Italy",        city:"Monza",
      circuit:"Autodromo Nazionale Monza", date:"2026-09-06", laps:53, length:5.793, flag:"🇮🇹",
      trackType:"power",     preferredAeroMode:"X", drsZones:2, tireWear:"low",
      winner:null, status:"upcoming",
      desc:"Temple of Speed. Maximum X-mode — lowest drag configuration on the calendar. Slipstream racing at its purest."
    },
    {
      round:14, id:"MAD", name:"Madrid GP",        country:"Spain",        city:"Madrid",
      circuit:"Madrid Street Circuit",     date:"2026-09-13", laps:55, length:5.476, flag:"🇪🇸",
      trackType:"technical", preferredAeroMode:"Z", drsZones:3, tireWear:"medium",
      winner:null, status:"upcoming",
      desc:"Brand-new street circuit through the Spanish capital. Z-mode essential through the tight urban chicanes."
    },
    {
      round:15, id:"AZE", name:"Azerbaijan GP",    country:"Azerbaijan",   city:"Baku",
      circuit:"Baku City Circuit",         date:"2026-09-26", laps:51, length:6.003, flag:"🇦🇿",
      trackType:"power",     preferredAeroMode:"X", drsZones:2, tireWear:"low",
      winner:null, status:"upcoming",
      desc:"Longest straight in F1 at 2.2 km. X-mode creates enormous speed gaps. Safety cars are frequent."
    },
    {
      round:16, id:"SGP", name:"Singapore GP",     country:"Singapore",    city:"Singapore",
      circuit:"Marina Bay Street Circuit", date:"2026-10-11", laps:62, length:5.063, flag:"🇸🇬",
      trackType:"technical", preferredAeroMode:"Z", drsZones:3, tireWear:"medium",
      winner:null, status:"upcoming",
      desc:"Night race with 23 corners. Humidity and concrete walls make it the most physically demanding circuit."
    },
    {
      round:17, id:"USA", name:"United States GP", country:"USA",          city:"Austin",
      circuit:"Circuit of The Americas",   date:"2026-10-25", laps:56, length:5.513, flag:"🇺🇸",
      trackType:"balanced",  preferredAeroMode:"Z", drsZones:2, tireWear:"high",
      winner:null, status:"upcoming",
      desc:"COTA's signature Turn 1 elevation change and technical back sector reward well-rounded setups."
    },
    {
      round:18, id:"MEX", name:"Mexico City GP",   country:"Mexico",       city:"Mexico City",
      circuit:"Autodromo Hermanos Rodriguez",date:"2026-11-01", laps:71, length:4.304, flag:"🇲🇽",
      trackType:"power",     preferredAeroMode:"X", drsZones:3, tireWear:"low",
      winner:null, status:"upcoming",
      desc:"High altitude reduces both aero and engine efficiency equally — X-mode straight-line advantage is amplified."
    },
    {
      round:19, id:"BRA", name:"Brazilian GP",     country:"Brazil",       city:"São Paulo",
      circuit:"Autodromo Jose Carlos Pace", date:"2026-11-08", laps:71, length:4.309, flag:"🇧🇷",
      trackType:"balanced",  preferredAeroMode:"X", drsZones:2, tireWear:"medium",
      winner:null, status:"upcoming",
      desc:"Interlagos atmosphere is electric. Weather can swing from dry to monsoon mid-race. Unpredictable."
    },
    {
      round:20, id:"LVG", name:"Las Vegas GP",     country:"USA",          city:"Las Vegas",
      circuit:"Las Vegas Strip Circuit",   date:"2026-11-21", laps:50, length:6.201, flag:"🇺🇸",
      trackType:"power",     preferredAeroMode:"X", drsZones:2, tireWear:"low",
      winner:null, status:"upcoming",
      desc:"Night race on the Strip. Extreme cold tires and massive straights create X-mode slipstream battles."
    },
    {
      round:21, id:"QAT", name:"Qatar GP",         country:"Qatar",        city:"Lusail",
      circuit:"Lusail International Circuit",date:"2026-11-29", laps:57, length:5.380, flag:"🇶🇦",
      trackType:"balanced",  preferredAeroMode:"Z", drsZones:2, tireWear:"extreme",
      winner:null, status:"upcoming",
      desc:"Brutal tire degradation — the fastest tire-wear circuit on the calendar. Strategy defines every outcome."
    },
    {
      round:22, id:"ABU", name:"Abu Dhabi GP",     country:"UAE",          city:"Abu Dhabi",
      circuit:"Yas Marina Circuit",        date:"2026-12-06", laps:58, length:5.281, flag:"🇦🇪",
      trackType:"balanced",  preferredAeroMode:"X", drsZones:2, tireWear:"low",
      winner:null, status:"upcoming",
      desc:"Season finale. Yas Marina's flowing layout is a fitting stage for championship deciders."
    }
  ],

  /* ── 2026 DRIVER ROSTER (22 drivers, 11 teams) ──────────── */
  /* Standings current as of Round 3 — Japanese GP           */
  drivers: [
    {
      id:"ANT", number:12, firstName:"Kimi",      lastName:"Antonelli",  constructor:"Mercedes",        constructorId:"mercedes",
      nationality:"Italian",      birthplace:"Bologna, Italy",          born:"25 Aug 2006", debut:"2025 (Mercedes)",
      championships:0, wins:4, poles:4, podiums:8,
      points:72, price:25, color:"#27F4D2",
      rating:{ overall:91, wet:90, technical:89, power:88, racecraft:88 },
      bio:"The prodigy Mercedes signed straight from the junior academy. Antonelli's debut season in 2025 showed flashes of brilliance; 2026 has confirmed his class. Championship leader after three rounds with two dominant wins in China and Japan. The youngest driver to lead the WDC since Verstappen."
    },
    {
      id:"RUS", number:63, firstName:"George",    lastName:"Russell",    constructor:"Mercedes",        constructorId:"mercedes",
      nationality:"British",      birthplace:"King's Lynn, England",    born:"15 Feb 1998", debut:"2019 (Williams)",
      championships:0, wins:4, poles:6, podiums:22,
      points:63, price:27, color:"#27F4D2",
      rating:{ overall:90, wet:88, technical:90, power:86, racecraft:88 },
      bio:"Composed, analytical, and capable of breathtaking one-lap speed. Russell claimed the opening race victory in Australia and pushed his teammate to the limit throughout. His engineering intelligence helps Mercedes maximise the W17's considerable potential every single weekend."
    },
    {
      id:"LEC", number:16, firstName:"Charles",   lastName:"Leclerc",    constructor:"Ferrari",         constructorId:"ferrari",
      nationality:"Monégasque",   birthplace:"Monte Carlo, Monaco",     born:"16 Oct 1997", debut:"2018 (Sauber)",
      championships:0, wins:8, poles:26, podiums:42,
      points:49, price:24, color:"#E8002D",
      rating:{ overall:88, wet:85, technical:93, power:89, racecraft:87 },
      bio:"Leclerc sits third in the championship — his qualifying brilliance and technical feedback make him Ferrari's cornerstone. Pairing with Hamilton has sharpened his race craft immeasurably. The SF-26 is a genuine race winner, and Charles is determined to convert raw pace into a maiden world title."
    },
    {
      id:"HAM", number:44, firstName:"Lewis",     lastName:"Hamilton",   constructor:"Ferrari",         constructorId:"ferrari",
      nationality:"British",      birthplace:"Stevenage, England",      born:"7 Jan 1985",  debut:"2007 (McLaren)",
      championships:7, wins:103, poles:104, podiums:197,
      points:41, price:22, color:"#E8002D",
      rating:{ overall:85, wet:95, technical:84, power:84, racecraft:96 },
      bio:"Seven-time world champion who stunned the paddock by joining Ferrari. The move has rekindled Hamilton's fire. Fourth in the championship at 41, he remains one of the most dangerous wet-weather drivers in the field. Under 2026's power regs, his tire management and racecraft give Ferrari a calculating edge."
    },
    {
      id:"NOR", number:4,  firstName:"Lando",     lastName:"Norris",     constructor:"McLaren",         constructorId:"mclaren",
      nationality:"British",      birthplace:"Bristol, England",        born:"13 Nov 1999", debut:"2019 (McLaren)",
      championships:0, wins:4, poles:7, podiums:28,
      points:25, price:28, color:"#FF8000",
      rating:{ overall:84, wet:91, technical:83, power:85, racecraft:90 },
      bio:"McLaren's talisman and one of the fastest drivers on the grid in any condition. Fifth in the championship despite strong pace — McLaren's MCL60 hasn't yet unlocked full potential under the new 2026 regulations. Norris's wet-weather instinct is among the best in the field."
    },
    {
      id:"PIA", number:81, firstName:"Oscar",     lastName:"Piastri",    constructor:"McLaren",         constructorId:"mclaren",
      nationality:"Australian",   birthplace:"Melbourne, Australia",    born:"6 Apr 2001",  debut:"2023 (McLaren)",
      championships:0, wins:2, poles:3, podiums:16,
      points:21, price:24, color:"#FF8000",
      rating:{ overall:82, wet:81, technical:83, power:82, racecraft:84 },
      bio:"Methodical, rapid, and a perfect technical complement to Norris. Piastri's measured approach to the 2026 regulations has earned genuine praise from McLaren's engineers. No longer his teammate's understudy — he is a co-leader with championship aspirations and the pace to back them up."
    },
    {
      id:"BEA", number:87, firstName:"Oliver",    lastName:"Bearman",    constructor:"Haas F1 Team",    constructorId:"haas",
      nationality:"British",      birthplace:"Chelmsford, England",     born:"8 May 2005",  debut:"2024 (Ferrari)",
      championships:0, wins:0, poles:0, podiums:0,
      points:17, price:10, color:"#B6BABD",
      rating:{ overall:79, wet:77, technical:79, power:77, racecraft:78 },
      bio:"The standout surprise of 2026 so far. Bearman's 17 points from three rounds has Haas in fourth in the constructors' standings — a result nobody predicted. His Ferrari junior pedigree is translating brilliantly into race results. Calm under pressure, fast over one lap, and relentless in the race."
    },
    {
      id:"GAS", number:10, firstName:"Pierre",    lastName:"Gasly",      constructor:"Alpine",          constructorId:"alpine",
      nationality:"French",       birthplace:"Rouen, France",           born:"7 Feb 1996",  debut:"2017 (Toro Rosso)",
      championships:0, wins:1, poles:0, podiums:6,
      points:15, price:12, color:"#FF87BC",
      rating:{ overall:78, wet:79, technical:78, power:77, racecraft:80 },
      bio:"Alpine's experienced leader, guiding the team through their Renault power unit step for 2026. Gasly's 15 points from three races reflects a team that has outperformed expectations. His Italian GP win remains his career highlight — the 2026 Alpine regularly puts him in positions to repeat it."
    },
    {
      id:"VER", number:1,  firstName:"Max",       lastName:"Verstappen",  constructor:"Red Bull Racing", constructorId:"red_bull",
      nationality:"Dutch",        birthplace:"Hasselt, Belgium",        born:"30 Sep 1997", debut:"2015 (Toro Rosso)",
      championships:4, wins:62, poles:41, podiums:110,
      points:12, price:29, color:"#3671C6",
      rating:{ overall:95, wet:96, technical:92, power:95, racecraft:98 },
      bio:"Four-time world champion sitting ninth — perhaps the most shocking statistic of 2026. The RB22's struggles with the new 50/50 power regulations have neutralised Verstappen's typical dominance. His raw talent rating remains the highest on the grid; when Red Bull fix their power unit issues, expect this standings position to change rapidly."
    },
    {
      id:"LAW", number:30, firstName:"Liam",      lastName:"Lawson",     constructor:"Racing Bulls",    constructorId:"racing_bulls",
      nationality:"New Zealander", birthplace:"Hastings, New Zealand",  born:"11 Feb 2002", debut:"2023 (AlphaTauri)",
      championships:0, wins:0, poles:0, podiums:0,
      points:10, price:8, color:"#6692FF",
      rating:{ overall:77, wet:76, technical:77, power:79, racecraft:78 },
      bio:"Lawson earned his Racing Bulls seat through consistent mid-season performances and is delivering on the investment. Tenth in the championship, he has extracted strong results from a car operating in the upper mid-field. His measured approach belies a natural aggression that emerges late in races."
    },
    {
      id:"LIN", number:41, firstName:"Arvid",     lastName:"Lindblad",   constructor:"Racing Bulls",    constructorId:"racing_bulls",
      nationality:"British",      birthplace:"London, England",         born:"8 Aug 2007",  debut:"2026 (Racing Bulls)",
      championships:0, wins:0, poles:0, podiums:0,
      points:4, price:8, color:"#6692FF",
      rating:{ overall:74, wet:71, technical:74, power:72, racecraft:72 },
      bio:"The youngest driver in F1 history to start a race and the sole pure rookie on the 2026 grid. Lindblad was the youngest-ever winner in both Formula 3 and Formula 2. His composure under pressure is extraordinary for an 18-year-old, and the Racing Bulls seat is just the beginning of what could be a legendary career."
    },
    {
      id:"HAD", number:6,  firstName:"Isack",     lastName:"Hadjar",     constructor:"Red Bull Racing", constructorId:"red_bull",
      nationality:"French",       birthplace:"Paris, France",           born:"28 Feb 2004", debut:"2025 (Racing Bulls)",
      championships:0, wins:0, poles:0, podiums:0,
      points:4, price:14, color:"#3671C6",
      rating:{ overall:73, wet:71, technical:73, power:74, racecraft:73 },
      bio:"Promoted to Red Bull Racing for 2026 after impressive results in his debut season with Racing Bulls. Hadjar is working through the challenges of a car still adapting to the new 2026 power regulations alongside Verstappen. His technical feedback is highly rated by Red Bull's engineering team."
    },
    {
      id:"BOR", number:5,  firstName:"Gabriel",   lastName:"Bortoleto",  constructor:"Audi",            constructorId:"audi",
      nationality:"Brazilian",    birthplace:"São Paulo, Brazil",       born:"14 Oct 2004", debut:"2025 (Kick Sauber)",
      championships:0, wins:0, poles:0, podiums:0,
      points:2, price:6, color:"#999999",
      rating:{ overall:75, wet:73, technical:75, power:74, racecraft:74 },
      bio:"Back-to-back F2 and F3 champion, Bortoleto became the first full-time Brazilian F1 driver since Felipe Massa. His debut season with Kick Sauber showed promise amid a difficult car. Now leading Audi's works programme alongside Hülkenberg as they attempt to find the performance the new power unit promises."
    },
    {
      id:"SAI", number:55, firstName:"Carlos",    lastName:"Sainz",      constructor:"Williams",        constructorId:"williams",
      nationality:"Spanish",      birthplace:"Madrid, Spain",           born:"1 Sep 1994",  debut:"2015 (Toro Rosso)",
      championships:0, wins:3, poles:5, podiums:25,
      points:2, price:11, color:"#64C4FF",
      rating:{ overall:81, wet:83, technical:82, power:80, racecraft:87 },
      bio:"Smooth Carlos chose Williams as his launchpad to prove he can lead a technical project to the front. The FW48 has been competitive in qualifying but converting it to points has proved difficult in the opening rounds. His 2023 Singapore win shows what he can do when strategy and pace align."
    },
    {
      id:"OCO", number:31, firstName:"Esteban",   lastName:"Ocon",       constructor:"Haas F1 Team",    constructorId:"haas",
      nationality:"French",       birthplace:"Évreux, France",          born:"17 Sep 1996", debut:"2016 (Manor)",
      championships:0, wins:1, poles:0, podiums:5,
      points:1, price:9, color:"#B6BABD",
      rating:{ overall:74, wet:77, technical:74, power:73, racecraft:76 },
      bio:"Ocon's Hungarian GP win in 2021 proved he can deliver on the biggest stage when opportunity strikes. At Haas alongside Bearman, he brings experience to back up the team's early-season surprise results. His smooth tire management and crafty undercut strategies are genuine weapons in a scrappy mid-field."
    },
    {
      id:"COL", number:43, firstName:"Franco",    lastName:"Colapinto",  constructor:"Alpine",          constructorId:"alpine",
      nationality:"Argentine",    birthplace:"Buenos Aires, Argentina", born:"27 May 2003", debut:"2024 (Williams)",
      championships:0, wins:0, poles:0, podiums:0,
      points:1, price:8, color:"#FF87BC",
      rating:{ overall:72, wet:71, technical:72, power:71, racecraft:71 },
      bio:"The first Argentine in Formula 1 in 23 years, Colapinto burst onto the scene mid-2024 and never looked back. His first full season with Alpine reflects a driver learning at extraordinary speed. Strong in qualifying, he is still finding his race-craft consistency — but the talent is unmistakably there."
    },
    {
      id:"HUL", number:27, firstName:"Nico",      lastName:"Hülkenberg",  constructor:"Audi",            constructorId:"audi",
      nationality:"German",       birthplace:"Emmerich, Germany",       born:"19 Aug 1987", debut:"2010 (Williams)",
      championships:0, wins:0, poles:1, podiums:0,
      points:0, price:6, color:"#999999",
      rating:{ overall:73, wet:74, technical:73, power:73, racecraft:78 },
      bio:"A veteran presence to anchor Audi's ambitious 2026 project. Hülkenberg's calm racecraft and meticulous engineering feedback are exactly what a new manufacturer needs during a critical development cycle. His zero podiums record belies a consistency that regularly delivers more than the car deserves."
    },
    {
      id:"ALB", number:23, firstName:"Alex",      lastName:"Albon",      constructor:"Williams",        constructorId:"williams",
      nationality:"Thai",         birthplace:"London, England",         born:"23 Mar 1996", debut:"2019 (Toro Rosso)",
      championships:0, wins:0, poles:0, podiums:2,
      points:0, price:11, color:"#64C4FF",
      rating:{ overall:74, wet:74, technical:74, power:73, racecraft:76 },
      bio:"Albon's Williams revival story is one of F1's finest redemption arcs. Written off by Red Bull, he rebuilt his career methodically. His tire management and smooth racecraft bring consistent performance in a car that can occasionally upset the established order when conditions align."
    },
    {
      id:"PER", number:11, firstName:"Sergio",    lastName:"Perez",      constructor:"Cadillac",        constructorId:"cadillac",
      nationality:"Mexican",      birthplace:"Guadalajara, Mexico",     born:"26 Jan 1990", debut:"2011 (Sauber)",
      championships:0, wins:16, poles:3, podiums:41,
      points:0, price:8, color:"#8A9BB0",
      rating:{ overall:73, wet:75, technical:72, power:74, racecraft:76 },
      bio:"Sixteen race wins and one of the most popular drivers on the grid, Perez brings invaluable experience to Cadillac's debut season. The new American team is still finding its footing with Ferrari power, and Checo's racecraft and fan following provide both sporting results and commercial value in abundance."
    },
    {
      id:"BOT", number:77, firstName:"Valtteri",  lastName:"Bottas",     constructor:"Cadillac",        constructorId:"cadillac",
      nationality:"Finnish",      birthplace:"Nastola, Finland",        born:"28 Aug 1989", debut:"2013 (Williams)",
      championships:0, wins:10, poles:20, podiums:67,
      points:0, price:5, color:"#8A9BB0",
      rating:{ overall:72, wet:73, technical:72, power:73, racecraft:71 },
      bio:"Ten wins, twenty poles — Bottas's career statistics tell the story of a driver who excelled at the very top. Now leading Cadillac's development programme through the most demanding regulatory change in the sport's history. His experience and precise technical feedback are the foundation on which the new team is building."
    },
    {
      id:"ALO", number:14, firstName:"Fernando",  lastName:"Alonso",     constructor:"Aston Martin",    constructorId:"aston_martin",
      nationality:"Spanish",      birthplace:"Oviedo, Spain",           born:"29 Jul 1981", debut:"2001 (Minardi)",
      championships:2, wins:32, poles:22, podiums:106,
      points:0, price:8, color:"#229971",
      rating:{ overall:80, wet:87, technical:82, power:76, racecraft:97 },
      bio:"At 44, Fernando Alonso races with the same obsessive fury he showed at 22. Aston Martin's 2026 car hasn't yet produced the points his talent deserves, but Alonso keeps delivering race craft masterclasses regardless. A third world title remains the stated goal — nobody in the paddock doubts his capability."
    },
    {
      id:"STR", number:18, firstName:"Lance",     lastName:"Stroll",     constructor:"Aston Martin",    constructorId:"aston_martin",
      nationality:"Canadian",     birthplace:"Montreal, Canada",        born:"29 Oct 1998", debut:"2017 (Williams)",
      championships:0, wins:0, poles:1, podiums:3,
      points:0, price:7, color:"#229971",
      rating:{ overall:68, wet:70, technical:67, power:68, racecraft:65 },
      bio:"Stroll's steadiest performances come at power circuits and street tracks where Aston Martin's raw speed shines. His three podiums have all come from exceptional race circumstances, and he continues to develop year on year under Alonso's exacting standards within the team."
    }
  ],

  /* ── 2026 CONSTRUCTOR STANDINGS (11 teams) ──────────────── */
  /* Current as of Round 3 — Japanese GP                     */
  constructors: [
    {
      id:"mercedes",    name:"Mercedes",          shortName:"Mercedes",    color:"#27F4D2",
      drivers:["ANT","RUS"], points:135, price:29, engine:"Mercedes",
      chassis:"W17", rating:97,
      desc:"The Silver Arrows have shattered expectations in 2026, leading the WCC with 135 points after just three rounds. The W17's interpretation of the new regulations is a masterpiece of engineering. Antonelli and Russell form the most potent driver pairing since Hamilton-Rosberg."
    },
    {
      id:"ferrari",     name:"Ferrari",           shortName:"Ferrari",     color:"#E8002D",
      drivers:["LEC","HAM"], points:90, price:25, engine:"Ferrari",
      chassis:"SF-26", rating:92,
      desc:"Ferrari leads the WCC battle in second. The SF-26 is fast everywhere, with Hamilton and Leclerc consistently delivering 1-2 finishes. The Scuderia's 2026 power unit development has paid dividends — they are the only team consistently challenging Mercedes."
    },
    {
      id:"mclaren",     name:"McLaren",           shortName:"McLaren",     color:"#FF8000",
      drivers:["NOR","PIA"], points:46, price:30, engine:"Mercedes",
      chassis:"MCL60", rating:85,
      desc:"McLaren's MCL60 is third in the constructors' standings but has shown a clear step is still needed to close the gap to Mercedes and Ferrari. Norris and Piastri are extracting maximum from the package — when McLaren close the regulation gap, they will be title contenders."
    },
    {
      id:"haas",        name:"Haas F1 Team",      shortName:"Haas",        color:"#B6BABD",
      drivers:["BEA","OCO"], points:18, price:10, engine:"Ferrari",
      chassis:"VF-26", rating:78,
      desc:"The biggest shock of 2026 so far — Haas sit fourth in the constructors' standings. Bearman's scoring consistency and Ocon's tactical experience have combined perfectly with Ferrari power. The American outfit is punching far above its expected weight class."
    },
    {
      id:"alpine",      name:"Alpine",            shortName:"Alpine",      color:"#FF87BC",
      drivers:["GAS","COL"], points:16, price:14, engine:"Renault",
      chassis:"A526", rating:76,
      desc:"Alpine's revamped Renault power unit has taken a meaningful performance step in 2026. Gasly's consistent points scoring and Colapinto's rapid development have the team fifth in the constructors' standings — surpassing all pre-season predictions."
    },
    {
      id:"red_bull",    name:"Red Bull Racing",   shortName:"Red Bull",    color:"#3671C6",
      drivers:["VER","HAD"], points:16, price:28, engine:"Honda/RBP",
      chassis:"RB22", rating:75,
      desc:"Red Bull's RB22 is struggling dramatically with the 2026 regulations — a shocking contrast to their four-year dominance. Sixth in the constructors' championship with just 16 points is deeply alarming. The Honda/RBP power unit's adaptation to the 50/50 split is the core issue their engineers are racing to resolve."
    },
    {
      id:"racing_bulls",name:"Racing Bulls",      shortName:"Racing Bulls",color:"#6692FF",
      drivers:["LAW","LIN"], points:14, price:9, engine:"Honda/RBP",
      chassis:"VCARB02", rating:74,
      desc:"Racing Bulls sit seventh despite sharing the same Honda/RBP power unit struggles as Red Bull. Lawson's consistent scoring and the remarkable Lindblad's debut have given the junior team cause for optimism. When Red Bull's power unit issues are resolved, expect a sharp performance jump."
    },
    {
      id:"williams",    name:"Williams",          shortName:"Williams",    color:"#64C4FF",
      drivers:["SAI","ALB"], points:2, price:13, engine:"Mercedes",
      chassis:"FW48", rating:64,
      desc:"Williams have the pace to score points regularly — the FW48 has shown well in qualifying — but converting that into race finishes has been elusive. Sainz's championship pedigree gives the team direction and confidence that the performance is coming."
    },
    {
      id:"audi",        name:"Audi",              shortName:"Audi",        color:"#999999",
      drivers:["BOR","HUL"], points:2, price:5, engine:"Audi",
      chassis:"C45", rating:62,
      desc:"Audi's highly anticipated works debut has been modest — just two points after three rounds. The brand-new Audi power unit is still in its development infancy, and the team's resources are vast. 2027 is the real target; 2026 is essential learning."
    },
    {
      id:"cadillac",    name:"Cadillac",          shortName:"Cadillac",    color:"#8A9BB0",
      drivers:["PER","BOT"], points:0, price:6, engine:"Ferrari",
      chassis:"MAC-26", rating:58,
      desc:"F1's new 11th team, backed by General Motors, makes its debut in 2026. Ferrari power and gearbox provide a solid technical foundation. Perez and Bottas bring a combined tally of 16 wins and 500+ race starts — providing crucial feedback to establish the team's infrastructure from day one."
    },
    {
      id:"aston_martin",name:"Aston Martin",      shortName:"Aston Martin",color:"#229971",
      drivers:["ALO","STR"], points:0, price:9, engine:"Honda/RBP",
      chassis:"AMR26", rating:60,
      desc:"Aston Martin's AMR26 is suffering the same Honda/RBP power unit adaptation issues as Red Bull, leaving Alonso and Stroll scoreless through three rounds. The team's infrastructure and investment level are genuine, however — a breakthrough result feels imminent with Alonso behind the wheel."
    }
  ]
};
