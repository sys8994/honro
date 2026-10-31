# Upper stair jump: second hold calibration

The same game-generated entry save was restored without editing battle state. Starting at x501, pressing jump before an 80 ms right hold ended at x559 and landed back on the middle support. The controller stopped immediately on the missed stair; it did not repeat the jump or claim mission success. The preceding 60 ms attempt landed at x535, so the next bounded UI attempt uses a 70 ms hold with a narrower takeoff band. Browser frame scheduling can vary, so this is a calibration attempt rather than a guaranteed collision fix.
