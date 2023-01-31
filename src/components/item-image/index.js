import './index.css';

const colors = {
    black: {r: 0, g: 0, b: 0, alpha: 77/255},
    blue: {r: 28, g: 65, b: 86, alpha: 77/255},
    default: {r: 127, g: 127, b: 127, alpha: 77/255},
    green: {r: 21, g: 45, b: 0, alpha: 77/255},
    grey: {r: 29, g: 29, b: 29, alpha: 77/255},
    orange: {r: 60, g: 25, b: 0, alpha: 77/255},
    red: {r: 109, g: 36, b: 24, alpha: 77/255},
    violet: {r: 76, g: 42, b: 85, alpha: 77/255},
    yellow: {r: 104, g: 102, b: 40, alpha: 77/255},
};

function ItemImage({ item }) {
    if (item.image512pxLink.includes('unknown-item') && !item.gridImageLink.includes('unknown-item')) {
        return (<img src={item.gridImageLink} alt={item.name}/>);
    }

    const color = colors[item.backgroundColor];
    const colorString = `${color.r}, ${color.g}, ${color.b}, ${color.alpha}`;

    const backgroundStyle = {
        backgroundColor: '#000000',
        backgroundImage: `url('data:image/svg+xml,\
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" style="fill:rgba(0, 0, 0, 1)" >\
                <rect x="0" y="0" width="2" height="2" style="fill:rgba(29, 29, 29, .62)" />\
                <rect x="0" y="2" width="2" height="2" style="fill:rgba(44, 44, 44, .62)" />\
                <rect x="2" y="0" width="2" height="2" style="fill:rgba(44, 44, 44, .62)" />\
                <rect x="2" y="2" width="2" height="2" style="fill:rgba(29, 29, 29, .62)" />\
                <rect x="0" y="0" width="4" height="4" style="fill:rgba(${colorString})" />\
            </svg>')`,
        //backgroundSize: '2px 2px',
        position: 'relative',
        outline: '2px solid #495154',
        outlineOffset: '-2px',
    };

    if (item.types?.includes('loading')) {
        const loadingStyle = {
            WebkitMask:`url(${item.image512pxLink}) center/cover`,
                  mask:`url(${item.image512pxLink}) center/cover`,
        };
        
        return (
            <div style={backgroundStyle}>
                <div className="item-image-mask" style={loadingStyle}></div>
            </div>
        )
    }

    return (
        <div style={backgroundStyle}>
            <img src={item.image512pxLink} alt={item.name}/>
            <div className='item-image-text'>{item.shortName}</div>
        </div>
    );
}

export default ItemImage;
