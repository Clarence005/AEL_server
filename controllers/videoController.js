const fs = require('fs');
const path = require('path');

function addadsPrefixToSegments(lines) {
  return lines.map(line => {
    if (line.trim().endsWith('.ts')) {
      return `/ads/${line.trim()}`;
    }
    return line;
  });
}
function addStaticPrefixToSegments(lines) {
  return lines.map(line => {
    if (line.trim().endsWith('.ts')) {
      return `/static/${line.trim()}`;
    }
    return line;
  });
}
exports.getVideoPlaylist = (req, res) => {
  // show ad only if the client sents the showad argument as true 
  const showAd = req.query.showAd === 'true';
  console.log("Connected");

  const lionPath = path.join(__dirname, '../lionking_hls/lionking.m3u8');
  const adPath = path.join(__dirname, '../ad_hls/ad.m3u8');

  let lionContent, adContent;
  try {
    // reading the content form m3u8 file to add the ad content to it
    lionContent = fs.readFileSync(lionPath, 'utf8');
    adContent = fs.readFileSync(adPath, 'utf8');
  } catch (err) {
    return res.status(500).send('Error reading HLS files.');
  }

  const lionLines = lionContent.split('\n');
  const adLinesRaw = adContent.split('\n').filter(line => !line.startsWith('#EXTM3U'));

  const lionLinesWithStatic = addStaticPrefixToSegments(lionLines);

  const adLinesWithStatic = addadsPrefixToSegments(adLinesRaw);

  if (!showAd) {
    // if the showAd is false return the lionking.m3u8 as itslef
    const lionPlaylist = lionLinesWithStatic.join('\n');
    console.log(lionPlaylist);
    return res.type('application/vnd.apple.mpegurl').send(lionPlaylist);
  }
  // adding ad segments to the 6th segment of the first segment of the lionking.m3u8
  const combined = [
    lionLinesWithStatic[0],              
    ...lionLinesWithStatic.slice(1, 7), 
    '#EXT-X-DISCONTINUITY',
    ...adLinesWithStatic,
    '#EXT-X-DISCONTINUITY',
    ...lionLinesWithStatic.slice(7)      
  ].join('\n');
  // sending teh merged m3u8
  console.log(combined);
  res.type('application/vnd.apple.mpegurl').send(combined);
};
