(function (G) {
  'use strict';
  // Menu-only, retained vector paintings. These do not add world geometry,
  // request assets, inspect progression, or own any character interactions.
  // The broad pine crown language follows the approved environment SVGs;
  // existing artwork and the shared combat renderer are intentionally untouched.
  const variants = Object.freeze(['forest', 'river', 'cliff', 'temple', 'cave', 'dawn']);
  const layers = Object.freeze(['surface', 'underground']);
  const cache = new Map();
  const palettes = {
    forest: { sky: '#102329', horizon: '#65746a', ridge: '#29434a', mist: '#a5b1a0', land: '#172925', light: '#5a6251', pine: '#142b26', leaf: '#355143' },
    river: { sky: '#152b35', horizon: '#788984', ridge: '#304e58', mist: '#b4c5bc', land: '#1c2c2d', light: '#646d5c', pine: '#193332', leaf: '#3b5750' },
    cliff: { sky: '#101f2b', horizon: '#5b757b', ridge: '#263e4d', mist: '#a1b4b2', land: '#1c2930', light: '#69716b', pine: '#1c3231', leaf: '#47584b' },
    temple: { sky: '#121f29', horizon: '#576e70', ridge: '#2c424c', mist: '#a5b5aa', land: '#222b2d', light: '#737263', pine: '#182d29', leaf: '#435446' },
    cave: { sky: '#101f28', horizon: '#43666d', ridge: '#223d48', mist: '#83a4a5', land: '#19262b', light: '#5b6766', pine: '#1b3031', leaf: '#384d46' },
    dawn: { sky: '#3b4551', horizon: '#c0ac87', ridge: '#526267', mist: '#d4c9ac', land: '#293536', light: '#86856b', pine: '#233d34', leaf: '#5c6a50' }
  };
  const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const group = (name, content, extra = '') => `<g data-art-layer="${name}" ${extra}>${content}</g>`;
  const stops = (a, b) => `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>`;
  const gradient = (id, a, b, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1" ${extra}>${stops(a, b)}</linearGradient>`;

  // A transformed circle is geometrically an ellipse and also avoids the
  // native SVG decoder's unsupported gradient-on-ellipse paint path.
  const glow = (x, y, rx, ry, id, extra = '') => `<g transform="translate(${x} ${y}) scale(1 ${ry / rx})" ${extra}><circle r="${rx}" fill="url(#${id})"/></g>`;

  function pine(x, y, scale, p, flip = false) {
    // One rooted trunk, three expressive branches, four broad needle masses.
    return `<g transform="translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})">` +
      path('M-27 5L-3-63 12-151 2-241 30-327 15-406 30-455 43-455 35-404 51-326 24-237 34-153 18-62 48 5 11-3 1-25-12 5Z M19-242L-61-278-122-284-152-309-146-318-113-299-55-299 32-267Z M31-331L88-371 157-386 190-414 199-410 167-371 95-355 26-309Z M31-407L-31-423-72-452-64-459-25-438 34-430Z', '#172324') +
      path('M6-13L14-65 25-150 16-241 40-326 25-403 33-441 31-404 46-326 22-239 30-151 14-62 32-3Z', p.light) +
      `<g data-rest-motion="pine-crown" data-rest-phase="${x / 240}">` +
      path('M-161-320C-183-335-155-352-129-342-113-366-80-369-60-357-35-377-1-366 11-350 36-363 64-341 70-323 46-311 21-311-2-320-26-306-50-315-66-320-87-309-111-318-123-327-143-319-153-322-161-320Z M-91-463C-98-480-79-489-62-483-45-504-17-503 0-489 16-505 43-494 54-481 74-486 95-469 99-454 77-445 59-452 46-458 21-448 1-455-13-463-39-453-62-462-91-463Z M67-387C49-401 74-417 97-408 115-431 143-435 163-423 182-440 212-435 225-420 249-426 272-408 268-396 249-382 230-388 213-393 193-380 169-386 153-390 128-373 105-383 90-388 80-382 74-385 67-387Z M-53-277C-73-294-51-310-29-300-11-318 8-319 26-307 41-317 65-306 71-293 53-280 34-282 19-286-2-275-29-285-53-277Z', p.pine) +
      path('M-157-337Q-143-349-129-342C-112-364-81-367-60-357Q-29-374-7-357L-28-347-61-348-89-339-115-338-133-330Z M-79-479L-61-483C-43-502-18-500 0-489Q22-500 43-484L20-478-4-480-24-472-50-476-65-469Z M76-405L97-408Q126-438 156-424C179-437 204-432 216-420L186 -416 166 -404 141 -407 117 -397 94 -397Z', p.leaf) + '</g></g>';
  }
  function rock(x, y, scale, p) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">` +
      path('M-94 2L-78-40-45-60-18-99 24-108 64-88 77-56 103-38 110 2 45 11-17 5-65 11Z', '#233239') +
      path('M-78-40L-45-60-18-99 24-108 9-72-22-39-39 4-94 2Z', p.light) +
      path('M24-108L64-88 77-56 56-39 9-72Z', '#46524e') +
      path('M9-72L56-39 45 11-17 5-39 4-22-39Z', '#384440') +
      path('M-82-31L-65-40-52-35-66-21-87-18Z M-35-55L-20-67-9-61-22-46Z M64-30L84-29 96-15 70-17Z', p.pine) + '</g>';
  }
  function shelter(kind, p) {
    if (kind === 'cave') return group('cave-refuge',
      path('M178 624L189 464 397 477 420 629Z', '#26363b') +
      path('M306 471L397 477 420 629 321 629Z', '#162932') +
      path('M144 466Q182 475 207 450L266 415 329 429 398 466 445 472 433 493 382 484 198 482 150 487Z', '#16262e') +
      path('M163 470L207 450 266 415 329 429 398 466 424 473 381 466 325 442 268 429 210 461Z', '#4b5757') +
      path('M206 488H218V626H206Z M309 486H323V630H309Z M392 491H404V630H392Z M207 486H406V495H207Z', '#746650') +
      path('M245 528H282V573H245Z', '#cfab66') + path('M260 528H264V574H260Z M246 548H282V553H246Z', '#594c38') +
      path('M339 521H378V626H339Z', '#101f25') + path('M163 622H429L448 639H153Z', '#57615d'));
    const temple = kind === 'temple';
    return group(temple ? 'temple-eave-shelter' : 'wayside-shelter',
      path('M175 634L205 488 455 491 480 636Z', '#19292b') +
      path('M189 640H477L499 656H167Z', '#505b51') +
      path('M208 487H221V638H208Z M428 490H441V640H428Z M213 498H439V510H213Z', '#71674d') +
      path('M211 515L236 547 241 542 221 513Z M427 515L402 546 397 541 418 513Z', '#8f7a53') +
      path('M236 557H383V625H236Z', '#243a35') +
      path('M239 620H399V631H239Z M248 631H259V642H248Z M381 631H392V642H381Z', '#665a43') +
      path(temple ? 'M126 487Q161 498 198 474L287 423 323 402 357 421 444 474Q478 491 512 480L499 506 447 502 193 508 140 504Z' : 'M154 490L206 466 308 438 451 481 497 498 480 514 428 502 311 477 215 498 159 511Z', '#14262e') +
      path(temple ? 'M151 490L198 474 287 423 323 402 357 421 444 474 486 489 440 484 352 439 323 420 294 439 203 489Z' : 'M168 492L206 466 308 438 451 481 483 497 433 489 309 458 213 485Z', temple ? '#4b5d64' : '#626651') +
      path(temple ? 'M195 476L286 426 323 405 359 424 439 472 350 438 322 418 296 437Z' : 'M205 467L308 438 451 481 422 479 308 449 224 477Z', temple ? '#849091' : '#8b8566') +
      path('M206 499L311 479 429 502 480 508', 'none', 'stroke="#ad9c70" stroke-opacity=".45" stroke-width="2"') +
      `<g data-rest-motion="lantern">` + path('M265 519H281V545H265Z', '#e2b767') +
      path('M261 516H285L282 520H264Z M264 544H282L279 550H267Z', '#3b3830') + '</g>');
  }
  function farLandscape(p, id, variant) {
    const dawn = variant === 'dawn';
    const sky = group('open-sky', path('M0 0H1600V900H0Z', `url(#${id}-sky)`) +
      glow(1144, dawn ? 284 : 186, 330, 275, `${id}-halo`) +
      `<circle cx="1144" cy="${dawn ? 284 : 186}" r="${dawn ? 46 : 30}" fill="${dawn ? '#e6cb97' : '#d4d4b8'}" opacity=".88"/>` +
      path('M829 212C956 197 1023 218 1133 211S1304 191 1400 214L1266 222 1191 220 1124 229 1007 226 941 219Z M152 308C270 285 341 319 458 299L527 309 419 327 361 323 269 334 223 325 125 332Z', p.mist, 'opacity=".16" data-rest-motion="cloud"'));
    const peaks = group('distant-ink-mountains',
      path('M-80 571L56 470 115 473 179 417 245 435 297 376 338 392 371 359 422 382 478 349 533 377 579 359 623 414 674 398 722 453 793 434 855 484 933 450 999 466 1072 413 1116 430 1174 370 1210 388 1260 342 1292 353 1327 315 1356 329 1394 287 1420 311 1450 299 1487 353 1547 375 1660 340V730H-80Z', p.ridge, 'opacity=".52"') +
      path('M-60 560L74 534 118 493 164 502 210 471 235 476 266 427 288 436 327 385 347 385 378 340 402 351 427 320 452 346 468 379 492 377 527 430 554 421 591 480 623 461 672 512 726 531 782 519 835 560 898 576 946 546 1001 558 1060 532 1110 547 1163 521 1229 547 1270 522 1326 551 1378 535 1445 564 1510 553 1640 576V756H-60Z', `url(#${id}-mountain)`) +
      path('M427 320L452 346 468 379 492 377 527 430 554 421 591 480 567 548 526 507 518 467 479 431 469 409 448 400 442 357Z M347 385L378 340 402 351 382 399 360 416 347 456 319 476 328 436Z M266 427L288 436 274 476 232 520 208 573 186 583 212 526Z', `url(#${id}-granite)`) +
      path('M427 320L414 388 433 453 456 499 482 589 519 639 486 574 470 494 447 452 436 390Z M327 385L310 448 288 468 270 540 245 574 250 540 273 459 302 426Z', '#162c34', 'opacity=".28"') +
      path('M1050 553L1126 485 1170 479 1206 444 1244 454 1292 414 1321 434 1358 420 1406 467 1445 456 1495 500 1550 488 1635 517V700H1030Z', p.ridge, 'opacity=".65"'));
    const mist = group('valley-mist',
      path('M-30 542C217 507 270 570 466 549S812 566 1017 547 1390 493 1630 551V720H-30Z', `url(#${id}-mist)`) +
      path('M119 588C338 564 446 590 602 569C727 550 796 565 875 576 710 580 679 604 515 600S291 592 119 606Z M817 618C1013 586 1149 620 1284 583 1365 562 1434 579 1492 585 1377 592 1355 614 1265 619L1137 632 963 628Z', p.mist, 'opacity=".12"'), 'data-rest-motion="mist"');
    return sky + peaks + mist;
  }
  function cavernBackdrop(p, id) {
    return group('subterranean-depth',
      path('M0 0H1600V900H0Z', `url(#${id}-sky)`) +
      path('M0 0H1600V591L1496 572 1435 594 1317 550 1269 503 1237 430 1181 395 1100 267 1010 299 961 244 870 257 803 183 710 201 626 142 531 173 470 140 364 203 301 172 187 237 139 399 93 443 40 535 0 552Z', '#21363f') +
      path('M0 0H1600V401L1517 348 1486 291 1401 263 1353 186 1223 174 1161 108 1036 153 973 125 861 179 755 106 644 93 527 124 415 91 273 145 202 118 100 213 56 383 0 422Z', '#182c35') +
      path('M117 577L170 463 206 439 217 362 254 325 284 421 319 449 345 567Z M1206 625L1244 567 1250 501 1286 469 1319 485 1339 570 1392 604 1415 652Z', '#304952') +
      path('M206 439L217 362 254 325 242 419 224 450 210 524 181 553Z M1286 469L1319 485 1339 570 1318 560 1303 506 1280 507Z', '#556c6b', 'opacity=".32"') +
      path('M-20 560C237 554 427 619 678 589S1240 542 1630 596V747H-20Z', `url(#${id}-mist)`, 'data-rest-motion="mist"')) + cavernEnclosure(p, id);
  }
  function cavernEnclosure(p, id) {
    return group('cavern-enclosure',
      path('M0 0H1600V204L1493 180 1374 209 1312 267 1249 280 1187 362 1135 403 1130 456 1077 504 1046 571 1009 581 946 593 901 566 861 493 787 442 739 351 657 325 595 260 499 244 407 188 351 208 289 278 253 385 232 460 270 558 301 600 282 677 168 703H0Z', '#14252d') +
      path('M0 0H1600V83L1451 94 1325 140 1235 143 1156 191 1091 275 1041 303 1029 373 968 423 943 471 899 451 861 394 792 363 744 286 669 259 607 205 515 194 443 148 341 156 286 207 243 246 220 353 188 388 163 497 199 578 172 653 104 680H0Z', '#20343d') +
      path('M0 0H951L809 43 664 27 589 80 443 105 341 156 286 207 243 246 220 353 188 388 163 497 128 486 139 372 179 302 187 236 264 163 352 124 389 76 477 43 0 87Z', '#3d5054') +
      path('M1559 105L1451 94 1325 140 1235 143 1156 191 1091 275 1041 303 1029 373 968 423 943 471 967 357 1005 314 1022 237 1109 164 1179 126 1289 105 1359 58 1468 62Z', '#39545a') +
      path('M395 126L430 199 460 214 477 257 502 246 518 194Z M686 259L719 331 739 351 742 294Z M1291 248L1274 320 1249 353 1249 280Z', '#1a2c35') +
      glow(1085, 586, 330, 110, `${id}-halo`, 'opacity=".42"'));
  }
  function placeLandscape(variant, p, id, underground = false) {
    if (variant === 'river') return group('river-reach',
      path('M552 570C704 555 790 573 957 552S1350 545 1610 571V750H362Z', `url(#${id}-water)`) +
      path('M633 594C765 582 860 599 1000 578M770 622C923 608 1022 625 1187 603M1005 659C1176 637 1310 656 1521 623M1202 580L1338 576M427 675L593 662', 'none', 'stroke="#b0beb0" stroke-width="2" opacity=".29" data-rest-motion="ripples"') +
      path('M963 618L991 601 1026 601 1047 581 1069 595 1089 608 1122 615 1084 627 1012 627Z M1207 624L1229 604 1250 595 1271 602 1290 616 1331 622 1349 634 1271 638Z', '#334944') +
      path('M1026 601L1047 581 1069 595 1056 596 1045 591 1034 605Z M1229 604L1250 595 1271 602 1257 605 1249 600Z', '#7e8c7a', 'opacity=".53"') +
      path('M1004 567L1111 547 1203 551 1280 579 1270 596 1209 576 1113 565 1015 585Z', '#334344') +
      path('M1041 572L1055 571 1054 600 1040 603Z M1234 579L1249 585 1248 613 1233 608Z', '#263c40') +
      path('M-20 679L42 615 87 618 138 588 198 599 251 575 286 604 348 623 409 649 480 656 454 710H-20Z', '#253d37') +
      (underground ? rock(224, 654, 1.03, p) : pine(226, 665, .76, p)) + rock(352, 683, .6, p) + shelter('river', p));
    if (variant === 'cliff') return group('granite-lee',
      path('M-40 159L88 118 155 144 210 206 236 291 292 328 315 393 359 416 395 499 453 555 450 674 248 714-40 706Z', '#203239') +
      path('M88 118L155 144 210 206 236 291 215 323 193 281 159 249 151 204 111 196 96 162Z M292 328L315 393 359 416 395 499 364 522 328 472 318 430 289 407 274 361Z M-40 159L88 118 62 201 21 246-13 355-40 388Z', '#5b6966') +
      path('M151 204L159 249 193 281 215 323 200 406 223 452 259 481 275 557 228 626 210 541 164 480 147 367 124 318Z', '#30464a') +
      path('M-40 641L41 607 129 620 179 590 269 618 304 659 438 662 460 698 111 718-40 704Z', '#2b393a') +
      pine(151, 638, .70, p, true) + rock(341, 684, .75, p) +
      path('M1115 584L1150 535 1168 518 1188 478 1202 442 1227 427 1243 442 1254 479 1280 509 1294 557 1324 583V671H1105Z', '#38505a', 'opacity=".62"') +
      path('M1243 442L1254 479 1280 509 1294 557 1271 537 1251 518 1242 489 1227 481Z', '#728078', 'opacity=".45"') +
      shelter('cliff', p));
    if (variant === 'temple') return group('temple-court',
      path('M-20 637H447L501 664 710 679 717 693H-20Z', '#394449') +
      path('M-20 639H447L472 651H-20Z', '#8a8872', 'opacity=".45"') +
      path('M25 441L152 454 165 631H18Z', '#32403d') +
      path('M-30 439L15 412 136 416 196 453 180 470 108 455 12 452-30 460Z', '#1e3139') +
      path('M-16 440L15 412 136 416 179 444 134 432 16 426Z', '#6a7674') +
      path('M2 453H14V640H2Z M124 455H140V640H124Z M11 522H125V530H11Z', '#786952') +
      (underground ? rock(484, 647, .87, p) : pine(474, 651, .74, p, true)) + shelter('temple', p) +
      path('M1149 666L1170 655 1176 588 1198 589 1204 655 1225 666Z M1163 586L1170 564 1203 564 1211 586Z M1151 562L1188 540 1224 562Z', '#536063') +
      path('M1180 574H1195V583H1180Z', '#e3bd73') +
      path('M1188 540L1224 562 1208 561 1186 551 1167 560 1151 562Z', '#879087'));
    if (variant === 'cave') return shelter('cave', p) + rock(438, 676, .77, p) + rock(1137, 665, .38, p);
    return group(variant === 'dawn' ? 'morning-pine-bank' : 'sheltered-pine-grove',
      path('M-40 671L25 637 95 629 148 583 204 597 252 576 329 609 365 637 431 635 492 673 438 722H-40Z', '#24382f') +
      pine(173, 685, 1.07, p) + pine(398, 658, .58, p, true) +
      rock(349, 691, .85, p) + shelter('forest', p) +
      path('M1164 671L1211 642 1256 644 1308 610 1354 629 1398 605 1442 641 1521 618 1630 646V750H1146Z', '#233934') +
      pine(1539, 698, .70, p, true) + rock(1225, 690, .44, p));
  }
  function campGround(p, id) {
    return group('continuous-travelling-ground',
      path('M-40 731C143 685 266 684 418 698S644 682 778 689 1016 692 1146 710 1421 678 1640 693V930H-40Z', `url(#${id}-ground)`) +
      path('M-40 753C135 707 255 711 414 731S653 710 797 714 1020 746 1168 740 1433 695 1640 710L1640 753C1421 730 1330 761 1187 779S1009 786 884 780 723 771 622 781 436 779 285 753 104 749-40 802Z', '#767865', 'opacity=".17"') +
      path('M-30 770C116 728 239 732 389 749S650 731 792 741 1015 775 1155 767 1434 720 1631 729', 'none', 'stroke="#b0a787" stroke-width="2" opacity=".15"') +
      group('fire-ground-light', glow(800, 758, 300, 103, `${id}-fire-ground`), 'data-rest-motion="fire-ground"') +
      path('M-30 847L60 826 117 835 167 821 228 839 289 830 352 851 428 854 469 870 565 864 634 886 737 882 817 909H-30Z M1082 906L1114 871 1197 854 1248 861 1304 835 1360 838 1415 813 1486 821 1533 801 1630 815V930Z', '#111f23') +
      path('M-18 851L-5 806 2 831 20 799 11 842 31 826 26 849Z M132 834L146 798 146 825 161 806 156 837Z M1472 823L1468 782 1480 802 1499 760 1493 807 1525 786 1512 814Z M1260 857L1273 830 1271 851 1290 831 1284 856Z', '#132626') +
      rock(71, 860, .94, {...p, light:'#45504a'}) + rock(1502, 855, .76, {...p, light:'#414d48'}) +
      path('M377 793L403 790 414 800 405 807 376 805 367 800Z M1157 805L1182 799 1192 807 1185 815 1155 814Z M654 831L669 828 679 834 669 839 650 836Z', '#5d6254', 'opacity=".44"'));
  }
  function campProps(id) {
    return group('resting-circle',
      `<ellipse cx="565" cy="768" rx="101" ry="15" fill="#0b171b" opacity=".6"/><ellipse cx="1044" cy="772" rx="103" ry="15" fill="#0b171b" opacity=".6"/>` +
      path('M468 750L627 739 635 759 480 772Z', '#302d24') +
      path('M468 750L627 739 623 747 482 760Z', '#776a49') +
      path('M480 755L492 756 497 770 485 773Z M610 749L621 750 626 763 615 765Z', '#473e2c') +
      path('M957 751L1128 763 1126 780 955 768Z', '#352c25') +
      path('M957 751L1128 763 1123 770 961 760Z', '#817052') +
      path('M969 764L981 764 980 777 968 776Z M1102 773L1115 774 1112 786 1100 785Z', '#473d2e') +
      `<ellipse cx="800" cy="766" rx="95" ry="24" fill="#0c171a" opacity=".7"/><ellipse cx="800" cy="759" rx="83" ry="24" fill="#af6733" opacity=".22"/>` +
      path('M738 754L749 744 770 746 777 757 760 765 743 763Z M822 749L835 741 851 746 860 758 852 765 834 764Z M756 765L770 757 786 763 789 774 774 780 758 775Z M804 766L819 757 836 764 838 776 822 782 807 778Z', '#5c5a4b') +
      path('M739 754L749 744 770 746 764 752 750 752Z M823 749L835 741 851 746 848 751 835 748Z M757 765L770 757 786 763 778 766 768 765Z M805 766L819 757 836 764 828 768 815 765Z', '#a08a60') +
      path('M766 743L776 736 834 756 829 766Z M769 759L824 735 834 740 779 770Z', '#3c2d23') +
      path('M775 740L830 757M778 761L828 738', 'none', 'stroke="#bd7f44" stroke-width="3" opacity=".7"') +
      group('fire-air-light', glow(800, 737, 93, 111, `${id}-fire-halo`), 'data-rest-motion="fire-halo"') +
      group('campfire',
        path('M778 754C755 729 778 718 777 698 786 710 788 709 790 696 793 685 805 679 803 663 823 681 808 697 821 709 828 717 831 724 827 735 840 725 831 720 836 709 852 734 828 757 811 758Z', '#c47736', 'class="journey-flame-outer" data-rest-motion="flame-outer"') +
        path('M783 751C773 738 788 727 790 714 793 720 798 723 799 709 800 699 807 696 808 686 818 706 804 713 817 726 827 736 818 752 808 756Z', '#edb55f', 'class="journey-flame-inner" data-rest-motion="flame-inner"') +
        path('M795 752C786 740 803 733 802 722 817 735 815 747 805 756Z', '#f5d59a', 'data-rest-motion="flame-core"') +
        path('M801 713L804 708 805 714 803 718Z', '#d6a86a', 'opacity=".6" data-rest-motion="ember" data-rest-phase="0"') +
        path('M821 715L824 711 825 716 823 720Z', '#d6a86a', 'opacity=".6" data-rest-motion="ember" data-rest-phase=".37"') +
        path('M780 727L782 724 783 728 781 731Z', '#d6a86a', 'opacity=".6" data-rest-motion="ember" data-rest-phase=".71"'))) +
      group('wayfinding-signpost',
        `<ellipse cx="1384" cy="769" rx="77" ry="15" fill="#0c171b" opacity=".56"/>` +
        path('M1371 587L1389 585 1384 766 1372 778 1365 768Z', '#3b3226') +
        path('M1371 587L1377 587 1375 769 1371 774 1368 766Z', '#8d7750') +
        path('M1307 605L1437 596 1477 621 1441 650 1301 655 1306 633 1301 617Z', '#3d382b') +
        path('M1307 605L1437 596 1477 621 1456 619 1434 606 1308 614Z', '#94825c') +
        path('M1309 615L1435 607 1457 621 1433 640 1308 645Z', '#665a40') +
        path('M1314 623L1350 620M1314 631L1337 628M1390 616L1426 614M1406 635L1434 631', 'none', 'stroke="#a18c5d" stroke-width="2" opacity=".35"') +
        path('M1354 624L1411 621M1397 612L1412 621 1399 632', 'none', 'stroke="#d5c19a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".76"') +
        `<circle cx="1377" cy="616" r="2.5" fill="#292c26"/><circle cx="1376" cy="638" r="2.5" fill="#292c26"/>` +
        path('M1354 773L1362 749 1367 765 1387 745 1380 770 1399 761 1394 775Z', '#26352c'));
  }
  function scene(variant, layer = 'surface') {
    variant = variants.includes(variant) ? variant : 'forest';
    layer = variant === 'cave' || layer === 'underground' ? 'underground' : 'surface';
    const underground = layer === 'underground';
    const key = `scene:${variant}:${layer}`;
    if (cache.has(key)) return cache.get(key);
    const p = underground ? {...palettes[variant], sky:'#101f28', horizon:'#38565d', ridge:'#223d48', mist:'#83a4a5'} : palettes[variant];
    const id = `honro-journey-${variant}-${layer}`;
    const defs = `<defs>` +
      gradient(`${id}-sky`, p.sky, p.horizon) + gradient(`${id}-mountain`, p.ridge, p.horizon) +
      gradient(`${id}-ground`, p.land, '#111d22') +
      `<linearGradient id="${id}-granite" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${p.light}" stop-opacity=".7"/><stop offset="1" stop-color="${p.ridge}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-mist" x2="0" y2="1"><stop offset="0" stop-color="${p.mist}" stop-opacity="0"/><stop offset=".6" stop-color="${p.mist}" stop-opacity=".32"/><stop offset="1" stop-color="${p.mist}" stop-opacity="0"/></linearGradient>` +
      gradient(`${id}-water`, underground ? '#45686e' : '#698582', '#2b454d') +
      `<radialGradient cx="50%" cy="50%" r="50%" id="${id}-halo"><stop offset="0" stop-color="${p.mist}" stop-opacity=".22"/><stop offset="1" stop-color="${p.mist}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient cx="50%" cy="50%" r="50%" id="${id}-fire-ground"><stop offset="0" stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>` +
      `<radialGradient cx="50%" cy="50%" r="50%" id="${id}-fire-halo"><stop offset="0" stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient></defs>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="${variant}" data-journey-layer="${layer}">` + defs +
      (underground ? cavernBackdrop(p, id) : farLandscape(p, id, variant)) + placeLandscape(variant, p, id, underground) + campGround(p, id) + campProps(id) + '</svg>';
    cache.set(key, svg);
    return svg;
  }

  // Deterministic, presentation-only motion. Only retained transforms/opacity
  // change: no path regeneration, filters, random particles or camera parallax.
  // The same attributes can be rasterized by the Native proof harness.
  function motionFrame(kind, seconds = 0, phase = 0) {
    const t = Math.max(0, Number(seconds) || 0), s = Math.sin;
    const n = v => Number(v.toFixed(4));
    const around = (x, y, sx, sy, angle = 0) => `translate(${x} ${y}) rotate(${n(angle)}) scale(${n(sx)} ${n(sy)}) translate(${-x} ${-y})`;
    const flicker = s(t * 8.1) * .62 + s(t * 13.7 + .8) * .25 + s(t * 4.3 + 2) * .13;
    switch (kind) {
      case 'flame-outer': return {transform:around(800,758,1 + flicker * .07,1 + s(t * 7.3) * .11 + flicker * .035,s(t * 5.4) * 2.1),opacity:String(n(.93 + flicker * .06))};
      case 'flame-inner': return {transform:around(800,758,1 - flicker * .10,1 + s(t * 9.2 + .5) * .13,-s(t * 6.7) * 2.8)};
      case 'flame-core': return {transform:around(803,756,1 + s(t * 11.1) * .09,1 + s(t * 8.4 + 1) * .12),opacity:String(n(.91 + s(t * 7.8) * .08))};
      case 'fire-ground': return {transform:around(800,758,1 + flicker * .045,1 + flicker * .07),opacity:String(n(.86 + flicker * .13))};
      case 'fire-halo': return {transform:around(800,737,1 + flicker * .09,1 + flicker * .11),opacity:String(n(.88 + flicker * .11))};
      case 'ember': {const u = ((t / 2.8 + phase) % 1 + 1) % 1;return {transform:`translate(${n(s(u * 5 + phase * 8) * 9)} ${n(-u * 78)})`,opacity:String(n(s(Math.PI * u) * .72))};}
      case 'pine-crown': return {transform:`rotate(${n(s(t * .85 + phase) * .42)} 0 -255)`};
      case 'lantern': return {transform:`rotate(${n(s(t * 1.15) * 1.4)} 273 516)`,opacity:String(n(.92 + s(t * 2.3) * .06))};
      case 'cloud': return {transform:`translate(${n(s(t * .14) * 12)} 0)`};
      case 'mist': return {transform:`translate(${n(s(t * .23) * 9)} ${n(s(t * .31) * 1.6)})`,opacity:String(n(.94 + s(t * .39) * .06))};
      case 'ripples': return {transform:`translate(${n(s(t * .8) * 4)} ${n(s(t * 1.2) * .6)})`,opacity:String(n(.25 + s(t * .9) * .045))};
      default: return {};
    }
  }

  function atlasRelief(id) {
    // Individually drawn, landscape-scale mountain systems. The empty river
    // basin belongs to the route/pin layer; this painting never knows progress.
    const wash = `url(#${id}-ridge)`, face = `url(#${id}-stone)`, ink = `url(#${id}-ink)`;
    return group('painted-mountain-systems',
      group('northwestern-folds',
        path('M-35 221C17 205 36 164 72 154Q111 148 138 119Q160 92 174 91L190 95Q201 109 204 124L224 130L253 123Q269 90 300 89L321 63 340 69Q359 110 387 113L418 106Q450 63 482 64Q491 42 504 44L522 51 524 72Q541 91 567 98L594 89Q621 69 640 87C667 112 669 146 704 157Q749 181 801 195L833 246Q706 270 654 266C582 284 531 255 450 275S296 258 223 269 63 257-35 292Z', wash) +
        path('M20 242C57 228 62 193 94 183L136 169 156 142 180 123Q193 144 217 157L254 153Q264 125 289 124L309 106 326 111Q342 151 374 158L423 144Q436 123 460 116L492 80 507 82Q521 120 552 138L592 133 620 113 638 121C659 152 647 174 690 195L737 232Q621 239 568 253L458 269 358 254 241 280 131 260 20 281Z', wash, 'opacity=".42"') +
        path('M174 91L190 95Q207 137 229 150L247 153C225 166 209 180 197 207L171 225Q172 188 164 175L176 148 166 142 138 176 107 185 80 215 58 223 76 183 119 156 138 119Z M321 63L340 69Q349 99 373 113L384 129 362 120 341 104 326 92 313 130 288 159 279 194 251 223 262 174 274 147 292 126 300 89Z M504 44L522 51Q527 90 554 114L575 121 589 147 566 143 541 125 526 102 511 88C500 128 490 151 463 169L452 202 427 218 439 177 471 136 482 98Z M620 113L638 121Q649 144 652 165L676 187 651 183 628 163 619 147 605 170 578 185 565 213 542 224 555 188 592 158Z', face) +
        path('M187 101Q200 140 192 166L180 185Q192 215 214 225L250 239C202 234 174 223 163 200L175 169Z M331 83C348 117 333 139 340 164L357 192 381 208Q348 205 329 181L312 156 322 132Z M510 68C524 107 507 146 515 173L542 207 581 224Q530 221 507 199L486 177 490 149Z M639 135C644 166 671 187 684 204L722 216 690 218 658 204 635 183 621 169Z', ink) +
        path('M37 255C109 229 152 244 203 241M247 248C314 220 367 250 412 240M429 252C505 227 569 244 606 235M587 255C649 236 710 250 769 239', 'none', 'stroke="#91a08a" stroke-width="3" stroke-opacity=".12" stroke-linecap="round"')) +
      group('northern-granite-spine',
        path('M842 253C884 235 901 206 935 202L959 180 987 183Q1005 154 1032 145L1051 108 1077 108 1093 128 1112 122 1136 83 1155 80 1173 107 1198 102 1219 69Q1219 42 1231 44L1248 39 1262 56 1264 80 1274 99 1298 117 1320 118 1339 141 1366 150 1383 134 1403 139 1422 171 1451 174 1480 201 1516 213 1530 239 1571 255 1590 285C1505 308 1451 287 1388 305S1261 281 1190 286 1071 267 993 284 893 279 842 289Z', wash) +
        path('M963 240L993 222 1014 182 1039 171 1063 134 1079 140 1082 166 1111 166 1149 112 1161 121 1170 150 1211 146 1245 84 1265 139 1301 150 1327 181 1359 191 1387 173 1403 192 1431 209 1465 233 1504 244 1557 281C1457 293 1401 283 1360 285L1260 295 1169 272 1098 288 1026 273 946 277Z', wash, 'opacity=".4"') +
        path('M1051 108L1077 108 1093 128 1080 140 1067 123 1058 151 1043 184 1018 197 1002 227 975 245 1000 205 1011 174 1032 145Z M1136 83L1155 80 1173 107 1172 126 1155 108 1146 117 1131 151 1102 184 1088 224 1067 236 1077 199 1110 154Z M1219 69L1231 44 1248 39 1262 56 1274 99 1298 117 1320 118 1339 141 1322 152 1295 137 1277 128 1252 79 1240 69 1229 111 1208 149 1201 185 1166 221 1145 230 1163 192 1185 153 1198 102Z M1383 134L1403 139 1422 171 1451 174 1480 201 1471 211 1445 193 1415 190 1393 162 1381 177 1356 212 1329 234 1348 204 1366 150Z', face) +
        path('M1248 54C1261 102 1251 129 1269 164L1300 193 1310 230 1341 256Q1284 248 1264 219L1255 185 1236 152 1240 114Z M1157 99L1172 126 1170 160 1151 186 1149 220 1127 246 1130 207 1145 171Z M1403 149L1418 176 1412 207 1440 242 1463 256 1420 247 1394 221 1390 190Z', ink) +
        path('M953 274C1028 250 1117 281 1161 268M1195 272Q1271 257 1328 275M1378 290C1444 267 1497 282 1545 278', 'none', 'stroke="#acb195" stroke-opacity=".1" stroke-width="3" stroke-linecap="round"')) +
      group('eastern-stone-escarpment',
        path('M1368 591C1402 566 1418 525 1457 509L1480 475 1477 452 1508 425 1523 389 1542 386 1566 409 1576 444 1603 458 1628 436 1652 443 1672 481 1697 496 1716 532 1737 531 1767 564 1822 582V698Q1730 667 1678 695C1633 711 1597 672 1542 688S1437 656 1371 670Z', wash) +
        path('M1508 425Q1519 385 1542 386L1566 409 1576 444 1603 458 1594 483 1567 467 1555 432 1536 408 1527 447 1505 478 1496 516 1463 551 1444 556 1465 518 1477 474 1477 452Z M1628 436L1652 443 1672 481 1697 496 1716 532 1692 523 1661 493 1641 465 1631 489 1604 516 1585 561 1558 582 1575 532 1604 491Z', face) +
        path('M1541 403C1550 445 1535 473 1550 508L1575 540 1561 588 1592 628 1539 612 1526 579 1533 549 1517 512 1518 469Z M1655 456L1672 481 1697 496 1716 532 1746 552 1757 589 1791 610 1741 599 1720 569 1686 552 1666 518Z', ink) +
        path('M1432 631Q1510 603 1599 647T1781 649', 'none', 'stroke="#8a9d8a" stroke-opacity=".11" stroke-width="3"')) +
      group('southwestern-wooded-ridges',
        path('M-25 781C18 763 24 728 55 718Q84 716 107 689L135 681 154 698 176 691Q188 652 215 646L239 626 256 633Q275 669 307 677L330 675 355 704 379 705 392 738 416 749 435 780C481 785 495 827 526 836L558 829 588 843 608 868 641 874 660 905 710 928 730 984Q639 1002 548 982T367 996 198 969 65 948L-25 944Z', wash) +
        path('M107 689L135 681 154 698 143 711 125 705 105 736 84 748 69 775 34 794 55 757 79 739Z M239 626L256 633Q263 666 282 680L307 677 330 675 355 704 348 718 318 699 290 710 267 694 250 664C239 706 219 722 209 753L180 780 153 788 178 754 195 714 215 689 215 646Z M435 780Q478 787 501 818L526 836 558 829 577 842 550 848 522 858 497 843 482 822 460 808 449 842 417 873 400 905 371 919 386 879 412 843Z M608 868L641 874 660 905 689 919 679 935 649 920 629 898 612 891 593 916 571 940 541 949 564 919Z', face) +
        path('M250 649C264 689 246 718 260 748L290 775 314 786 283 799 250 777 230 748 234 711Z M454 798C468 833 447 858 468 887L496 912 532 928 491 931 457 910 437 881 440 848Z', ink) +
        path('M25 869C117 822 201 856 272 833S379 838 424 868M221 929C291 902 344 938 391 927M448 969C524 941 622 969 689 958', 'none', 'stroke="#a4ac8b" stroke-opacity=".1" stroke-width="3" stroke-linecap="round"')) +
      group('southeastern-long-ridge',
        path('M1238 977C1295 959 1305 925 1344 916L1371 885 1392 889 1419 862 1443 857 1461 828 1487 818 1506 829 1520 860 1561 868 1583 890 1624 896 1643 918 1676 922 1710 947 1761 951 1824 981V1069H1198Z', wash) +
        path('M1461 828L1487 818 1506 829 1520 860 1561 868 1583 890 1550 892 1519 877 1494 849 1478 852 1467 881 1436 905 1424 935 1388 953 1401 925 1423 893 1443 857Z M1624 896L1643 918 1676 922 1710 947 1685 950 1654 936 1634 931 1613 919 1594 944 1568 959 1537 967 1562 942 1583 921Z', face) +
        path('M1498 839L1520 860 1531 892 1516 921 1543 947 1574 959 1525 957 1498 937 1505 909 1493 880Z', ink)) +
      // Continuous, translucent valley veils dissolve the ink into the map.
      // Large low-contrast shapes replace repeated decorative contour noise.
      group('atlas-valley-mist',
        path('M-30 222C110 205 208 254 322 237S538 230 686 218L811 239 850 283C692 261 622 296 478 275S217 288 116 267L-30 289Z', `url(#${id}-mist)`) +
        path('M831 256C958 235 1043 269 1167 253S1381 272 1519 259L1579 283C1424 296 1328 307 1208 289S1007 291 831 294Z', `url(#${id}-mist)`) +
        path('M1397 595C1495 566 1548 627 1648 607S1773 613 1829 625V687C1711 646 1648 681 1552 657S1461 661 1397 641Z', `url(#${id}-mist)`) +
        path('M-30 900C115 844 245 903 363 886S551 939 713 923L753 974C572 945 521 983 365 948S127 963-30 961Z', `url(#${id}-mist)`) +
        path('M47 302C179 279 227 305 338 294S550 308 659 293M974 315C1078 306 1119 325 1210 313M1435 700C1536 675 1644 703 1743 684M107 977C204 957 274 983 335 976', 'none', 'stroke="#aab49b" stroke-opacity=".1" stroke-width="2" stroke-linecap="round"')));
  }
  function atlasStoneStrata(id) {
    // Underground retains its chamber geography, without outdoor peak stamps.
    return group('subterranean-stone-strata',
      path('M379 147C425 130 438 105 474 100L513 84 542 91 574 75 602 88 614 106 651 111 682 143 722 154Q625 160 591 148L553 162 491 150 427 170Z M826 669L853 631 889 623 918 598 940 607 956 640 989 656 960 669 917 658 890 675Z M1326 981L1370 950 1405 946 1448 914 1482 926 1520 911 1553 933 1572 952 1628 967 1681 988 1576 1001 1519 986 1446 1003Z', `url(#${id}-ridge)`, 'opacity=".48"') +
      path('M474 100L513 84 542 91 574 75 602 88 614 106 651 111 644 123 602 117 575 97 547 112 515 102 485 121 451 126Z M889 623L918 598 940 607 956 640 938 632 920 616 906 637 879 643Z M1405 946L1448 914 1482 926 1520 911 1553 933 1572 952 1548 945 1522 929 1485 942 1450 933 1420 955Z', `url(#${id}-stone)`, 'opacity=".42"'));
  }
  function atlas(layer) {
    layer = layers.includes(layer) ? layer : 'surface';
    const key = `atlas:${layer}`;
    if (cache.has(key)) return cache.get(key);
    const underground = layer === 'underground', id = `honro-atlas-${layer}`;
    const base = `<defs>` +
      `<linearGradient id="${id}-ridge" x2=".14" y2="1"><stop stop-color="#617366" stop-opacity=".70"/><stop offset=".48" stop-color="#455b50" stop-opacity=".65"/><stop offset="1" stop-color="#30483f" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-stone" x2=".2" y2="1"><stop stop-color="#adb095" stop-opacity=".57"/><stop offset=".52" stop-color="#91a08a" stop-opacity=".29"/><stop offset="1" stop-color="#91a08a" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-ink" x2=".2" y2="1"><stop stop-color="#142b2e" stop-opacity=".76"/><stop offset=".65" stop-color="#1b3233" stop-opacity=".63"/><stop offset="1" stop-color="#233a37" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-mist" x2="0" y2="1"><stop stop-color="#aab49b" stop-opacity="0"/><stop offset=".48" stop-color="#aab49b" stop-opacity=".10"/><stop offset="1" stop-color="#aab49b" stop-opacity="0"/></linearGradient>` +
      `${gradient(`${id}-paper`, underground ? '#15272d' : '#28382f', underground ? '#101b22' : '#172a2b')}<radialGradient cx="50%" cy="50%" r="50%" id="${id}-wash"><stop offset="0" stop-color="${underground ? '#698380' : '#b4aa7c'}" stop-opacity=".2"/><stop offset="1" stop-color="#768573" stop-opacity="0"/></radialGradient></defs>` +
      path('M0 0H1800V1050H0Z', `url(#${id}-paper)`) +
      glow(800, 500, 850, 540, `${id}-wash`) +
      path('M43 99Q365 42 685 77T1331 75L1758 104V954Q1426 1000 1147 969T523 985L41 951Z', 'none', 'stroke="#879580" stroke-opacity=".11" stroke-width="2"');
    const geography = underground ? group('subterranean-landforms',
      // Large chamber mouths are centered on the authored map anchors. Passage
      // branches describe adjacency; the host adds progress-sensitive routes.
      path('M0 0H1800V1050H0Z', '#293b3e') +
      path('M0 18L193 73 382 43 557 126 727 91 939 139 1117 71 1332 116 1516 79 1800 143V0H0Z M0 1004L188 974 332 1004 546 948 697 988 891 965 1091 1003 1264 949 1491 972 1651 934 1800 969V1050H0Z', '#4c5b54', 'opacity=".4"') +
      path('M230 200C389 221 435 374 580 400S925 294 1080 300 1216 420 1320 490 1301 657 1290 765M580 400C620 520 711 610 670 740S398 850 270 890M670 740C914 760 1054 857 1290 765', 'none', 'stroke="#829180" stroke-opacity=".2" stroke-width="132" stroke-linecap="round"') +
      path('M230 200C389 221 435 374 580 400S925 294 1080 300 1216 420 1320 490 1301 657 1290 765M580 400C620 520 711 610 670 740S398 850 270 890M670 740C914 760 1054 857 1290 765', 'none', 'stroke="#142a32" stroke-width="98" stroke-linecap="round"') +
      group('stone-gate-chamber', path('M113 131L164 99 253 108 299 147 330 192 302 257 249 286 179 268 118 230 99 172Z', '#162b33') + path('M113 131L164 99 253 108 299 147 318 178 285 155 247 127 174 119 130 150 109 190 99 172Z', '#68766b', 'opacity=".42"')) +
      group('village-chamber', path('M377 385L414 308 482 289 530 267 612 282 703 302 756 360 739 453 703 495 622 522 537 492 461 508 390 461 365 418Z', '#172e35') + path('M377 385L414 308 482 289 530 267 612 282 703 302 756 360 724 347 687 325 611 306 533 295 490 311 440 333 411 391Z', '#708071', 'opacity=".29"')) +
      group('waterworks-chamber', path('M495 702L536 634 599 616 683 623 750 654 791 717 769 796 701 832 630 844 558 812 492 770 478 738Z', '#19343d') + path('M495 702L536 634 599 616 683 623 750 654 767 687 737 678 676 649 607 640 551 655 520 703Z', '#687e73', 'opacity=".31"')) +
      group('temple-chamber', path('M909 284L947 215 1012 176 1091 183 1180 216 1230 282 1218 345 1170 384 1099 405 1010 380 934 386 894 343Z', '#172c34') + path('M909 284L947 215 1012 176 1091 183 1180 216 1230 282 1200 267 1164 241 1084 206 1018 200 968 235 943 282Z', '#778072', 'opacity=".32"')) +
      group('hoist-chamber', path('M1201 470L1237 416 1311 381 1369 403 1445 430 1479 489 1443 561 1378 589 1307 572 1242 552 1186 512Z', '#192f35')) +
      group('bell-vault', path('M1075 747L1114 673 1189 633 1261 640 1321 664 1405 661 1470 713 1503 799 1481 863 1420 918 1332 930 1262 910 1184 924 1100 870 1070 812Z', '#13282f') + path('M1075 747L1114 673 1189 633 1261 640 1321 664 1405 661 1470 713 1487 751 1453 735 1395 688 1313 691 1254 667 1199 658 1137 695 1107 750Z', '#6c796e', 'opacity=".32"')) +
      group('exit-chamber', path('M124 848L181 806 251 811 298 832 353 834 389 883 369 940 304 970 224 959 164 974 112 931 97 885Z', '#1c343b')) +
      path('M604 461C636 531 693 589 699 643S702 725 670 740 567 790 514 813 371 858 255 905 184 942 151 958', 'none', 'stroke="#628e94" stroke-width="29" stroke-opacity=".18"') +
      path('M604 461C636 531 693 589 699 643S702 725 670 740 567 790 514 813 371 858 255 905 184 942 151 958', 'none', 'stroke="#95b0a5" stroke-width="3" stroke-opacity=".24"') +
      path('M811 499L854 457 905 460 941 522 922 576 864 588 829 554Z M879 811L920 853 970 862 1007 824 986 783 938 761Z', '#627164', 'opacity=".22"') +
      path('M797 517L815 577 858 607 903 592 911 626 875 651 811 608 778 555Z M1537 344L1581 365 1626 336 1634 382 1594 400 1549 389Z', '#819080', 'opacity=".14"') +
      atlasStoneStrata(id) +
      path('M471 375H530V383H471Z M478 375V351H483V375Z M519 375V351H524V375Z M460 351Q480 357 501 331 520 353 541 349L535 359H467Z M1040 276H1131V286H1040Z M1051 277V236H1058V277Z M1115 277V236H1122V277Z M1026 236Q1053 245 1085 212 1117 239 1145 232L1135 249H1037Z', '#b5ac84', 'opacity=".28"')) :
      group('surface-geography',
        path('M-30 258C159 249 162 339 308 377S420 501 551 519 639 655 755 682 810 794 956 825 1136 880 1215 1069', 'none', 'stroke="#93b8af" stroke-opacity=".07" stroke-width="143"') +
        path('M-30 258C159 249 162 339 308 377S420 501 551 519 639 655 755 682 810 794 956 825 1136 880 1215 1069', 'none', 'stroke="#7b9c97" stroke-opacity=".37" stroke-width="35"') +
        path('M-30 258C159 249 162 339 308 377S420 501 551 519 639 655 755 682 810 794 956 825 1136 880 1215 1069', 'none', 'stroke="#c3cbb0" stroke-opacity=".19" stroke-width="3"') +
        path('M551 519C580 452 668 476 677 392S761 327 788 227M810 748C921 702 980 727 1038 663S1164 647 1214 544', 'none', 'stroke="#91b1a4" stroke-opacity=".23" stroke-width="8"') +
        atlasRelief(id) +
        path('M-30 401Q182 398 215 443T407 486M839 892Q1047 862 1088 929T1303 958M1302 352Q1457 316 1506 364T1778 365M845 97Q925 82 996 108', 'none', 'stroke="#aab49b" stroke-opacity=".09" stroke-width="2"') +
        path('M444 470L471 444 493 451 528 481 518 488 487 462 473 460 454 480Z M1208 521H1299V533H1208Z M1218 524V482H1226V524Z M1283 524V482H1291V524Z M1193 482Q1223 491 1252 457 1281 484 1313 477L1303 494H1203Z', '#d1c199', 'opacity=".3"'));
    const compass = group('map-compass', `<g transform="translate(1643 158)">` +
      `<circle r="53" fill="none" stroke="#b5ae8b" stroke-opacity=".18"/>` +
      path('M0-66L10-10 0-17-10-10Z M0 66L-10 10 0 17 10 10Z', '#b5b295', 'opacity=".6"') +
      path('M-66 0L-10-7-17 0-10 7Z M66 0L10 7 17 0 10-7Z', '#b5b295', 'opacity=".3"') +
      `<circle r="5" fill="#b5b295" opacity=".6"/></g>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1050" width="1800" height="1050" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-atlas="${layer}">` + base + geography + compass + '</svg>';
    cache.set(key, svg);
    return svg;
  }
  G.HonroJourneyArt = Object.freeze({
    scene, atlas, variants, layers, motionFrame,
    anchors: Object.freeze({
      fire: Object.freeze({ x: 800, y: 745, groundY: 765 }),
      signpost: Object.freeze({ x: 1370, y: 628, groundY: 769 }),
      gathering: Object.freeze({ x: 800, y: 760, left: 480, right: 1130 }),
      scene: Object.freeze({ width: 1600, height: 900 }),
      atlas: Object.freeze({ width: 1800, height: 1050 })
    })
  });
})(globalThis);
