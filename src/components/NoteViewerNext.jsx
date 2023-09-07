import LinkCard from './LinkCard';
import { BlockMath } from 'react-katex';
import { nanoid } from 'nanoid';
import 'katex/dist/katex.min.css';

function ViewerComponent({ view }) {
  const highlightColors = {
    gray: {
      text: "#9b9a97",
      background: "#ebeced",
    },
    brown: {
      text: "#64473a",
      background: "#e9e5e3",
    },
    red: {
      text: "#e03e3e",
      background: "#fbe4e4",
    },
    orange: {
      text: "#d9730d",
      background: "#f6e9d9",
    },
    yellow: {
      text: "#dfab01",
      background: "#fbf3db",
    },
    green: {
      text: "#4d6461",
      background: "#ddedea",
    },
    blue: {
      text: "#0b6e99",
      background: "#ddebf1",
    },
    purple: {
      text: "#6940a5",
      background: "#eae4f2",
    },
    pink: {
      text: "#ad1a72",
      background: "#f4dfeb",
    },
  };

  const textAlignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const headingClasses = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
    5: 'text-lg',
    6: 'text-base',
  };

  const renderContent = (content) => {
    return content.map((contentItem, index) => {
      if (contentItem.type === 'math') {
        return <BlockMath math={contentItem.props.equation} key={index} />;
      }
      let styles = {};
      if (contentItem.styles) {
        const textColor = contentItem.styles.textColor && contentItem.styles.textColor !== 'default' ? highlightColors[contentItem.styles.textColor]?.text : undefined;
        const backgroundColor = contentItem.styles.backgroundColor && contentItem.styles.backgroundColor !== 'default' ? highlightColors[contentItem.styles.backgroundColor]?.background : undefined;

        styles = {
          fontWeight: contentItem.styles.bold ? 'bold' : undefined,
          fontStyle: contentItem.styles.italic ? 'italic' : undefined,
          textDecoration: contentItem.styles.underline ? 'underline' : contentItem.styles.strike ? 'line-through' : undefined,
          backgroundColor: backgroundColor,
          color: textColor,
        };
      }

      if (contentItem.type === 'link') {
        if (contentItem.href === contentItem.content[0].text) {
          return <LinkCard href={contentItem.href} key={index} />;
        } else {
          return <a href={contentItem.href} key={index} style={styles}>{renderContent(contentItem.content)}</a>;
        }
      }

      return <span style={styles} key={index}>{contentItem.text}</span>;
    });
  };
  const groupedData = view?.content?.reduce((acc, currentItem) => {
    const prevGroup = acc[acc.length - 1];

    if (prevGroup && prevGroup[0].type === currentItem.type && (currentItem.type === 'bulletListItem' || currentItem.type === 'numberedListItem')) {
      prevGroup.push(currentItem);
    } else {
      acc.push([currentItem]);
    }

    return acc;
  }, []);

  return (
    <div className='w-full h-full '>
      <div className='flex items-center pt-2 pb-1 px-3  mb-2 border-solid border-0 border-b border-b-slate-200 relative min-h-10'>
        <div className='font-bold text-base md:text-lg pl-1 whitespace-wrap'>{view?.name || "Note"}</div>
        <div className='flex-grow h-full'></div>
      </div>
      <div className='w-full relative h-[calc(100%_-_50px)] overflow-y-auto'>
        <div className="space-y-4 px-4">
          {groupedData.map((group, groupIndex) => {
            const firstItem = group[0];
            switch (firstItem.type) {
              case 'bulletListItem':
                return (
                  <ul key={groupIndex} className="list-disc list-inside pl-7 space-y-1 text-gray-700">
                    {group.map((item) => (
                      <li key={item.id}>{renderContent(item.content)}</li>
                    ))}
                  </ul>
                );

              case 'numberedListItem':
                return (
                  <ol key={groupIndex} className="list-decimal list-inside pl-7 space-y-1 font-semibold text-gray-600">
                    {group.map((item) => (
                      <li key={item.id}>{renderContent(item.content)}</li>
                    ))}
                  </ol>
                );

                default:
                  return group.map((item) => {
                    switch (item.type) {
                      case 'heading':
                        const HeadingTag = `h${item.props.level}`;
                        return (
                          <HeadingTag
                            className={`font-bold ${headingClasses[item.props.level]} ${textAlignmentClasses[item.props.textAlignment]}`}
                            key={item.id}
                          >
                            {renderContent(item.content)}
                          </HeadingTag>
                        );
                
                      case 'paragraph':
                        return (
                          <p
                            className={`text-base ${textAlignmentClasses[item.props.textAlignment]} mt-6 leading-relaxed`}
                            key={item.id}
                          >
                            {renderContent(item.content)}
                            {item.children.map((child, index) => (
                              <div key={index} className="ml-4">
                                {renderContent(child.content)}
                              </div>
                            ))}
                          </p>
                        );
                
                      case 'image':
                        return <div className='w-full flex justify-center items-center'>
                          <img src={item.props.src} alt={item.props.alt} style={{ width: `${item.props.width}%` }} key={item.id} />;
                        </div>
                
                      case 'math':
                        console.log(item.props.equation)
                        return <BlockMath math={item.props.equation} key={item.id} />;
                
                      default:
                        return null;
                    }
                  });
            }
          })}
        </div>
        <BlockMath math="y=2x"  />;
      </div>
    </div>
    
  );
}


export default ViewerComponent;