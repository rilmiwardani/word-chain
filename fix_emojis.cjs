const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
let lines = code.split('\n');
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('title={t("stats_wins")}')) {
        lines[i] = '                                                            <span title={t("stats_wins")} className="flex items-center gap-1"><Trophy className="w-4 h-4 text-amber-400 inline" /> <span className="text-amber-400 font-bold">{stat.wins || 0}</span></span>';
    }
    if (lines[i].includes('title={t("stats_games")}')) {
        lines[i] = '                                                            <span title={t("stats_games")} className="flex items-center gap-1"><Gamepad2 className="w-4 h-4 text-sky-400 inline" /> <span className="text-sky-400 font-bold">{stat.games || 0}</span></span>';
    }
    if (lines[i].includes('title={t("stats_kills")}')) {
        lines[i] = '                                                            <span title={t("stats_kills")} className="flex items-center gap-1"><Target className="w-4 h-4 text-emerald-400 inline" /> <span className="text-emerald-400 font-bold">{stat.kills || 0}</span></span>';
    }
    if (lines[i].includes('<div className="absolute -top-2 -right-1 text-lg">')) {
        lines[i] = '                                                        {index === 0 && <div className="absolute -top-3 -right-2 text-lg"><Crown className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-md" /></div>}';
    }
    if (lines[i].includes('<span className="text-4xl drop-shadow-sm animate-bounce">') && lines[i].includes('</span>')) {
        lines[i] = '                                                        <span className="text-4xl drop-shadow-sm animate-bounce"><Gift className="w-10 h-10 text-pink-400 fill-pink-500/20" /></span>';
    }
    if (lines[i].includes('{effect.giftPictureUrl ? <img src={effect.giftPictureUrl} className="w-4 h-4 object-contain inline" alt="gift" /> :')) {
        lines[i] = '                                            {effect.giftPictureUrl ? <img src={effect.giftPictureUrl} className="w-4 h-4 object-contain inline" alt="gift" /> : <Gift className="w-4 h-4 inline text-pink-400" />}';
    }
    if (lines[i].includes('BOM WAKTU')) {
        lines[i] = lines[i].replace(/dY\?[\+]/g, '??').replace(/💣/g, '??').replace(/dY\?\\\+/g, '??').replace(/[^\x00-\x7F] BOM WAKTU/g, '?? BOM WAKTU');
    }
}
fs.writeFileSync('src/App.jsx', lines.join('\n'));
