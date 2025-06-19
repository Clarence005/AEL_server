const fs = require('fs'); 
const path = require('path');

function addAdsPrefixToSegments(lines) {
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
  const showAd = req.query.showAd === 'true';
  const lionPath = path.join(__dirname, '../lionking_hls/lionking.m3u8');
  const adPath = path.join(__dirname, '../ad_hls/ad.m3u8');

  let lionContent, adContent;
  try {
    lionContent = fs.readFileSync(lionPath, 'utf8');
    adContent = fs.readFileSync(adPath, 'utf8');
  } catch (err) {
    return res.status(500).send('Error reading HLS files.');
  }

  const lionLines = lionContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('#EXT-X-ENDLIST'));

  const lionHeaders = lionLines.filter(line =>
    line.startsWith('#EXTM3U') ||
    line.startsWith('#EXT-X-VERSION') ||
    line.startsWith('#EXT-X-TARGETDURATION') ||
    line.startsWith('#EXT-X-MEDIA-SEQUENCE') ||
    line.startsWith('#EXT-X-PLAYLIST-TYPE')
  );
  const lionSegments = lionLines.filter(line => !lionHeaders.includes(line));
  const lionSegmentsWithStatic = addStaticPrefixToSegments(lionSegments);

  const adLines = adContent
    .split('\n')
    .map(line => line.trim())
    .filter(line =>
      line !== '' &&
      !line.startsWith('#EXTM3U') &&
      !line.startsWith('#EXT-X-VERSION') &&
      !line.startsWith('#EXT-X-TARGETDURATION') &&
      !line.startsWith('#EXT-X-MEDIA-SEQUENCE') &&
      !line.startsWith('#EXT-X-PLAYLIST-TYPE') &&
      !line.startsWith('#EXT-X-ENDLIST')
    );

  const adLinesWithPrefix = addAdsPrefixToSegments(adLines);

  if (!showAd) {
    const finalPlaylist = [...lionHeaders, ...lionSegmentsWithStatic, '#EXT-X-ENDLIST'].join('\n');
    return res.type('application/vnd.apple.mpegurl').send(finalPlaylist);
  }

  const adDurations = adContent
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.startsWith('#EXTINF:'))
  .map(line => parseFloat(line.replace('#EXTINF:', '').replace(',', '')))
  .filter(val => !isNaN(val));

const adDurationMs = Math.round(adDurations.reduce((a, b) => a + b, 0) * 1000);

  const combined = [
    ...lionHeaders,
    lionSegmentsWithStatic[0],
    lionSegmentsWithStatic[1],
    '#EXT-X-DISCONTINUITY',
    ...adLinesWithPrefix,
    '#EXT-X-DISCONTINUITY',
    ...lionSegmentsWithStatic.slice(2),
    '#EXT-X-ENDLIST'
  ].join('\n');
  res
    .set('X-Ad-Duration', adDurationMs.toString())
    .type('application/vnd.apple.mpegurl')
    .send(combined);
};
