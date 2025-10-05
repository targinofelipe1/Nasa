const RadarTooltipContent = ({ active, payload, data, cities, latestYear, formatValue }: any) => {
    if (active && payload && payload.length) {
        const categoryName = payload[0].payload.category;
        
        return (
            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-sm space-y-1">
                <p className="font-bold text-gray-800 border-b pb-1 mb-1">{categoryName}</p>
                {
                    cities.map((cityName: string, index: number) => {
                        const cityObj = data.cities.find((c: any) => c.name === cityName);
                        const valueInHa = cityObj?.metrics[payload[0].name]?.[latestYear] || 0;

                        return (
                            <div key={cityName} className="flex justify-between items-center" style={{ color: payload[index].stroke }}>
                                <span className="font-semibold mr-2">{cityName}:</span>
                                <span>{formatValue(valueInHa, 'ha')}</span>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
    return null;
};