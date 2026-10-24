// Pronunciation aliases supplement the original titles; they never rename songs.
// Keep this explicit: English spelling alone cannot determine Korean pronunciation.
const entries=[
 ['amazing kiss','어메이징 키스'],['angelus','안젤루스','안젤러스','안제루스'],['bad apple','배드 애플'],
 ['candy candy','캔디 캔디'],['days','데이즈'],['drivers high','드라이버스 하이'],['hot limit','핫 리미트'],
 ['lovers','러버스'],['maze','메이즈'],['night dancer','나이트 댄서'],['odoloop','오도루프'],['ponponpon','폰폰폰','퐁퐁퐁'],
 ['pretender','프리텐더'],['ray','레이'],['tsunami','쓰나미','츠나미'],['ultra soul','울트라 소울'],['valenti','발렌티'],
 ['winter love','윈터 러브'],['boy meets girl','보이 미츠 걸','보이 밋츠 걸'],['butterfly','버터플라이'],
 ['catch you catch me','캐치 유 캐치 미'],['ditto','디토'],['dont know what to do','돈 노 왓 투 두','돈트 노 왓 투 두'],
 ['eternal snow','이터널 스노우'],['every heart','에브리 하트'],['get out','겟 아웃'],['girls never die','걸스 네버 다이'],
 ['good luck','굿 럭'],['grace','그레이스'],['grip','그립'],['happy','해피'],['hype boy','하입 보이','하이프 보이'],
 ['i am star','아이 엠 스타','아이엠 스타'],['kick it','킥 잇'],['love attack','러브 어택'],['love chronicle','러브 크로니클'],
 ['love me or leave me','러브 미 오어 리브 미'],['loving you','러빙 유'],['my sweet heart','마이 스위트 하트','마이 스윗 하트'],
 ['myself','마이셀프'],['new future','뉴 퓨처','뉴 퓨쳐'],['no1','넘버 원','넘버원'],['really really','릴리 릴리','리얼리 리얼리'],
 ['anima','아니마'],['blue bird','블루 버드'],['brave shine','브레이브 샤인'],['breeze','브리즈'],['butterfly kiss','버터플라이 키스'],
 ['catch the moment','캐치 더 모먼트'],['cherry picking days','체리 피킹 데이즈'],['connect','커넥트'],['cry baby','크라이 베이비'],
 ['departures','디파처스','디파쳐스'],['eternal blaze','이터널 블레이즈'],['glamorous sky','글래머러스 스카이'],
 ['god knows','갓 노우즈','갓 노즈'],['calc','칼크','카루쿠'],['breath of stella','브레스 오브 스텔라'],
 ['stay with me','스테이 위드 미'],['dont go','돈트 고','돈 고'],['acoustic','어쿠스틱'],['news','뉴스'],['short hair','쇼트 헤어'],
 ['dolls','돌스'],['spark','스파크'],['boy in luv','보이 인 러브'],['fever','피버'],['me gustas tu','메 구스타스 투'],
 ['glass bead','글래스 비드'],['rock','록','락'],['mirotic','미로틱'],['miniskirt','미니스커트'],['uso','우소'],
 ['ai scream','아이 스크림','아이스크림'],['pleasure line','플레저 라인'],['dan dan','단 단','단단'],['invoke','인보크'],
 ['irony','아이러니'],['see u later','씨 유 레이터','시 유 레이터'],['smile','스마일'],['stay','스테이'],['time lapse','타임 랩스'],
 ['trouble maker','트러블 메이커'],['vanity colon','배니티 콜론','바니티 콜론'],['y','와이'],['you i','유 앤 아이','유앤아이'],
 ['just communication','저스트 커뮤니케이션','저스트 커뮤니케이숀'],['kick back','킥 백'],['last stardust','라스트 스타더스트'],
 ['magia','마기아'],['make it','메이크 잇'],['masayume chasing','마사유메 체이싱'],['my soul your beats','마이 소울 유어 비츠'],
 ['orange','오렌지'],['polaris','폴라리스'],['rain','레인'],['realize','리얼라이즈'],['reason','리즌'],['rose','로즈'],
 ['secret base','시크릿 베이스'],['silky heart','실키 하트'],['sincerely','신시어리','신시얼리'],['snow halation','스노우 할레이션'],
 ['start dash','스타트 대시','스타트 대쉬'],['stay alive','스테이 얼라이브'],['you','유'],['destiny','데스티니'],
 // Common words also cover new/custom titles containing these words.
 ['amazing','어메이징'],['kiss','키스'],['bad','배드'],['apple','애플'],['candy','캔디'],['drivers','드라이버스'],
 ['high','하이'],['hot','핫'],['limit','리미트'],['night','나이트'],['dancer','댄서'],['ultra','울트라'],['soul','소울'],
 ['winter','윈터'],['love','러브'],['boy','보이'],['meets','미츠','밋츠'],['girl','걸'],['catch','캐치'],['me','미'],
 ['dont','돈트','돈'],['know','노'],['what','왓'],['to','투'],['do','두'],['eternal','이터널'],['snow','스노우'],
 ['every','에브리'],['heart','하트'],['get','겟'],['out','아웃'],['girls','걸스'],['never','네버'],['die','다이'],['good','굿'],
 ['luck','럭'],['hype','하입','하이프'],['i','아이'],['am','엠'],['star','스타'],['kick','킥'],['it','잇'],['attack','어택'],
 ['chronicle','크로니클'],['or','오어'],['leave','리브'],['loving','러빙'],['my','마이'],['sweet','스위트','스윗'],
 ['new','뉴'],['future','퓨처','퓨쳐'],['really','리얼리','릴리'],['blue','블루'],['bird','버드'],['brave','브레이브'],
 ['shine','샤인'],['the','더'],['moment','모먼트'],['cherry','체리'],['picking','피킹'],['cry','크라이'],['baby','베이비'],
 ['blaze','블레이즈'],['glamorous','글래머러스'],['sky','스카이'],['god','갓'],['knows','노우즈','노즈'],['breath','브레스'],
 ['of','오브'],['stella','스텔라'],['with','위드'],['go','고'],['short','쇼트'],['hair','헤어'],['in','인'],['luv','러브'],
 ['glass','글래스'],['bead','비드'],['ai','아이'],['scream','스크림'],['pleasure','플레저'],['line','라인'],
 ['see','씨','시'],['u','유'],['later','레이터'],['time','타임'],['lapse','랩스'],['trouble','트러블'],['maker','메이커'],
 ['vanity','배니티','바니티'],['colon','콜론'],['just','저스트'],['communication','커뮤니케이션'],['back','백'],
 ['last','라스트'],['stardust','스타더스트'],['make','메이크'],['masayume','마사유메'],['chasing','체이싱'],
 ['your','유어'],['beats','비츠'],['secret','시크릿'],['base','베이스'],['silky','실키'],['halation','할레이션'],
 ['start','스타트'],['dash','대시','대쉬'],['alive','얼라이브'],['live','라이브'],
 // Artist aliases are useful for English-only custom song entries, too.
 ['boa','보아'],['lisa','리사'],['aimer','에메','에이머'],['day6','데이식스'],['egoist','에고이스트'],
 ['bump of chicken','범프 오브 치킨'],['blackpink','블랙핑크'],['bts','방탄소년단'],['exo','엑소'],['aoa','에이오에이'],
 ['winner','위너'],['twomix','투믹스'],['kalafina','칼라피나'],['true','트루'],['zone','존'],['lia','리아']
];
const compact=text=>text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const aliases=new Map(entries.map(([text,...values])=>[compact(text),values]));
export function pronunciationAliases(value,{includeWords=true}={}){
 const text=String(value||''),words=text.match(/[a-z0-9]+(?:['’.-][a-z0-9]+)*/gi)||[];
 const result=new Set([...(aliases.get(compact(text))||[]),...(aliases.get(compact(words.join(' ')))||[])]);
 if(words.length){
  result.add(words.map(word=>aliases.get(compact(word))?.[0]||word).join(' '));
  if(includeWords)for(const word of words)for(const alias of aliases.get(compact(word))||[])result.add(alias);
 }
 return [...result];
}
